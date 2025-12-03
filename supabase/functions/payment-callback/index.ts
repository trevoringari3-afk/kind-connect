import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// M-Pesa callback structure
interface MpesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value: string | number }>;
      };
    };
  };
}

// Airtel Money callback structure  
interface AirtelCallback {
  transaction: {
    id: string;
    message: string;
    status_code: string;
    airtel_money_id: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Payment callback received:", JSON.stringify(body, null, 2));

    // Determine callback type and process accordingly
    if (body.Body?.stkCallback) {
      // M-Pesa STK Push callback
      return await handleMpesaCallback(supabase, body as MpesaCallback);
    } else if (body.transaction) {
      // Airtel Money callback
      return await handleAirtelCallback(supabase, body as AirtelCallback);
    } else {
      console.log("Unknown callback format:", body);
      return new Response(
        JSON.stringify({ error: "Unknown callback format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("Payment callback error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleMpesaCallback(supabase: any, callback: MpesaCallback) {
  const { stkCallback } = callback.Body;
  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

  console.log("Processing M-Pesa callback:", { CheckoutRequestID, ResultCode, ResultDesc });

  // Find the transaction
  const { data: transaction, error: findError } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("provider_transaction_id", CheckoutRequestID)
    .eq("provider", "mpesa")
    .single();

  if (findError || !transaction) {
    console.error("Transaction not found:", CheckoutRequestID);
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (ResultCode === 0) {
    // Payment successful
    const metadata: Record<string, any> = { ...transaction.metadata, ResultDesc };
    
    // Extract callback metadata
    if (CallbackMetadata?.Item) {
      CallbackMetadata.Item.forEach((item) => {
        metadata[item.Name] = item.Value;
      });
    }

    // Update transaction as completed
    await supabase
      .from("payment_transactions")
      .update({
        status: "completed",
        metadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    // Activate subscription
    await activateSubscription(supabase, transaction.user_id, transaction.tier);

    console.log("M-Pesa payment completed successfully:", transaction.id);
  } else {
    // Payment failed
    await supabase
      .from("payment_transactions")
      .update({
        status: "failed",
        metadata: { ...transaction.metadata, ResultCode, ResultDesc },
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    console.log("M-Pesa payment failed:", { transactionId: transaction.id, ResultDesc });
  }

  // M-Pesa expects this response format
  return new Response(
    JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleAirtelCallback(supabase: any, callback: AirtelCallback) {
  const { transaction: txData } = callback;
  const { id: transactionRef, status_code, message, airtel_money_id } = txData;

  console.log("Processing Airtel callback:", { transactionRef, status_code, message });

  // Find the transaction
  const { data: transaction, error: findError } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("provider_transaction_id", transactionRef)
    .eq("provider", "airtel")
    .single();

  if (findError || !transaction) {
    console.error("Transaction not found:", transactionRef);
    return new Response(
      JSON.stringify({ status: "received" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Airtel status codes: TS = Success, TF = Failed, TP = Pending
  if (status_code === "TS") {
    // Payment successful
    await supabase
      .from("payment_transactions")
      .update({
        status: "completed",
        metadata: { ...transaction.metadata, airtel_money_id, message },
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    // Activate subscription
    await activateSubscription(supabase, transaction.user_id, transaction.tier);

    console.log("Airtel payment completed successfully:", transaction.id);
  } else if (status_code === "TF") {
    // Payment failed
    await supabase
      .from("payment_transactions")
      .update({
        status: "failed",
        metadata: { ...transaction.metadata, airtel_money_id, message },
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    console.log("Airtel payment failed:", { transactionId: transaction.id, message });
  }
  // For TP (pending), we wait for another callback

  return new Response(
    JSON.stringify({ status: "received" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function activateSubscription(supabase: any, userId: string, tier: string) {
  console.log("Activating subscription:", { userId, tier });

  // Calculate expiry (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Get tier benefits
  const benefits = getTierBenefits(tier);

  // Check if user already has a subscription
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existingSub) {
    // Update existing subscription
    const { error } = await supabase
      .from("subscriptions")
      .update({
        tier,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        daily_messages_limit: benefits.daily_messages,
        visibility_boost: benefits.visibility_boost,
        advanced_insights: benefits.advanced_insights,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to update subscription:", error);
      throw error;
    }
  } else {
    // Create new subscription
    const { error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        tier,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        daily_messages_limit: benefits.daily_messages,
        visibility_boost: benefits.visibility_boost,
        advanced_insights: benefits.advanced_insights,
      });

    if (error) {
      console.error("Failed to create subscription:", error);
      throw error;
    }
  }

  console.log("Subscription activated successfully");
}

function getTierBenefits(tier: string) {
  switch (tier) {
    case "basic":
      return { daily_messages: 25, visibility_boost: 50, advanced_insights: false };
    case "premium":
      return { daily_messages: 100, visibility_boost: 100, advanced_insights: true };
    default:
      return { daily_messages: 5, visibility_boost: 0, advanced_insights: false };
  }
}

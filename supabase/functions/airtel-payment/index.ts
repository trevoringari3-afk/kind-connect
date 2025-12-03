import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AirtelPaymentRequest {
  phoneNumber: string;
  amount: number;
  tier: "basic" | "premium";
  userId: string;
}

// Get Airtel Money access token
async function getAirtelAccessToken(): Promise<string> {
  const clientId = Deno.env.get("AIRTEL_CLIENT_ID");
  const clientSecret = Deno.env.get("AIRTEL_CLIENT_SECRET");
  
  if (!clientId || !clientSecret) {
    throw new Error("Airtel Money credentials not configured");
  }

  // Use sandbox URL for testing
  const tokenUrl = "https://openapiuat.airtel.africa/auth/oauth2/token";
  
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Airtel token error:", error);
    throw new Error("Failed to get Airtel access token");
  }

  const data = await response.json();
  return data.access_token;
}

// Generate unique transaction reference
function generateTransactionRef(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `SA${timestamp}${random}`.toUpperCase();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, amount, tier, userId }: AirtelPaymentRequest = await req.json();

    // Validate input
    if (!phoneNumber || !amount || !tier || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: phoneNumber, amount, tier, userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number (remove country code prefix, keep only digits)
    let formattedPhone = phoneNumber.replace(/\s+/g, "").replace(/[^0-9]/g, "");
    
    // Remove country code if present
    if (formattedPhone.startsWith("254")) {
      formattedPhone = formattedPhone.substring(3);
    }
    if (formattedPhone.startsWith("0")) {
      formattedPhone = formattedPhone.substring(1);
    }

    // Validate phone number (should be 9 digits for Kenya)
    if (!/^\d{9}$/.test(formattedPhone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format. Use format: 0712345678" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const transactionRef = generateTransactionRef();

    // Create pending transaction record
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: userId,
        amount,
        tier,
        provider: "airtel",
        phone_number: `254${formattedPhone}`,
        status: "pending",
        currency: "KES",
        provider_transaction_id: transactionRef,
      })
      .select()
      .single();

    if (txError) {
      console.error("Transaction creation error:", txError);
      return new Response(
        JSON.stringify({ error: "Failed to create transaction record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if credentials are configured
    const clientId = Deno.env.get("AIRTEL_CLIENT_ID");
    const clientSecret = Deno.env.get("AIRTEL_CLIENT_SECRET");
    
    if (!clientId || !clientSecret) {
      console.log("Airtel credentials not configured - returning sandbox response");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment initiated (sandbox mode - credentials not configured)",
          transactionId: transaction.id,
          transactionRef,
          sandbox: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token
    const accessToken = await getAirtelAccessToken();

    // Callback URL
    const callbackUrl = `${supabaseUrl}/functions/v1/payment-callback`;

    // Airtel Money collection request
    const collectionUrl = "https://openapiuat.airtel.africa/merchant/v1/payments/";
    
    const collectionPayload = {
      reference: transactionRef,
      subscriber: {
        country: "KE",
        currency: "KES",
        msisdn: formattedPhone,
      },
      transaction: {
        amount: amount,
        country: "KE",
        currency: "KES",
        id: transactionRef,
      },
    };

    console.log("Initiating Airtel Money collection:", { phoneNumber: formattedPhone, amount, tier });

    const collectionResponse = await fetch(collectionUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Country": "KE",
        "X-Currency": "KES",
      },
      body: JSON.stringify(collectionPayload),
    });

    const collectionData = await collectionResponse.json();
    console.log("Airtel collection response:", collectionData);

    if (collectionData.status?.success) {
      // Update transaction with Airtel transaction ID
      await supabase
        .from("payment_transactions")
        .update({
          metadata: {
            airtelTransactionId: collectionData.data?.transaction?.id,
            status: collectionData.data?.transaction?.status,
          },
        })
        .eq("id", transaction.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment request sent. Please check your phone and approve the payment.",
          transactionId: transaction.id,
          transactionRef,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Update transaction as failed
      await supabase
        .from("payment_transactions")
        .update({ 
          status: "failed", 
          metadata: collectionData 
        })
        .eq("id", transaction.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: collectionData.status?.message || "Failed to initiate payment",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("Airtel payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

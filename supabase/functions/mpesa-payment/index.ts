import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MpesaPaymentRequest {
  phoneNumber: string;
  amount: number;
  tier: "basic" | "premium";
  userId: string;
}

// Get M-Pesa access token
async function getMpesaAccessToken(): Promise<string> {
  const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
  const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
  
  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa credentials not configured");
  }

  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  
  // Use sandbox URL for testing, production URL for live
  const tokenUrl = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  
  const response = await fetch(tokenUrl, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("M-Pesa token error:", error);
    throw new Error("Failed to get M-Pesa access token");
  }

  const data = await response.json();
  return data.access_token;
}

// Generate timestamp in format YYYYMMDDHHmmss
function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Generate password for STK Push
function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  return btoa(`${shortcode}${passkey}${timestamp}`);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, amount, tier, userId }: MpesaPaymentRequest = await req.json();

    // Validate input
    if (!phoneNumber || !amount || !tier || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: phoneNumber, amount, tier, userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number (remove leading 0 or +254, ensure starts with 254)
    let formattedPhone = phoneNumber.replace(/\s+/g, "");
    if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.substring(1);
    }
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }

    // Validate phone number format
    if (!/^254\d{9}$/.test(formattedPhone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format. Use format: 0712345678 or 254712345678" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create pending transaction record
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: userId,
        amount,
        tier,
        provider: "mpesa",
        phone_number: formattedPhone,
        status: "pending",
        currency: "KES",
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

    // Get M-Pesa credentials
    const shortcode = Deno.env.get("MPESA_SHORTCODE");
    const passkey = Deno.env.get("MPESA_PASSKEY");
    
    if (!shortcode || !passkey) {
      console.log("M-Pesa credentials not configured - returning sandbox response");
      // Return a sandbox/demo response when credentials aren't configured
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment initiated (sandbox mode - credentials not configured)",
          transactionId: transaction.id,
          checkoutRequestId: `demo_${transaction.id}`,
          sandbox: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token
    const accessToken = await getMpesaAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(shortcode, passkey, timestamp);

    // Callback URL (update this with your actual callback URL)
    const callbackUrl = `${supabaseUrl}/functions/v1/payment-callback`;

    // STK Push request
    const stkPushUrl = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    
    const stkPushPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: `SmartApproach-${transaction.id.substring(0, 8)}`,
      TransactionDesc: `${tier} subscription payment`,
    };

    console.log("Initiating STK Push:", { phoneNumber: formattedPhone, amount, tier });

    const stkResponse = await fetch(stkPushUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPushPayload),
    });

    const stkData = await stkResponse.json();
    console.log("STK Push response:", stkData);

    if (stkData.ResponseCode === "0") {
      // Update transaction with checkout request ID
      await supabase
        .from("payment_transactions")
        .update({
          provider_transaction_id: stkData.CheckoutRequestID,
          metadata: { MerchantRequestID: stkData.MerchantRequestID },
        })
        .eq("id", transaction.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "STK Push sent. Please check your phone and enter your M-Pesa PIN.",
          transactionId: transaction.id,
          checkoutRequestId: stkData.CheckoutRequestID,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Update transaction as failed
      await supabase
        .from("payment_transactions")
        .update({ status: "failed", metadata: stkData })
        .eq("id", transaction.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: stkData.errorMessage || stkData.ResponseDescription || "Failed to initiate payment",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("M-Pesa payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

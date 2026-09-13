const Stripe = require("stripe");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const { amount, description, invoiceNumber } = JSON.parse(event.body);

    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid amount" }),
      };
    }

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    // Create a one-off price for this invoice amount
    const price = await stripe.prices.create({
      currency: "usd",
      unit_amount: Math.round(amount * 100),
      product_data: {
        name: description || "Biblical Counseling Session",
        metadata: { invoice_number: invoiceNumber || "" },
      },
    });

    // Create payment link with card and ACH bank transfer
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      payment_method_types: ["card", "us_bank_account"],
      metadata: { invoice_number: invoiceNumber || "" },
      after_completion: {
        type: "hosted_confirmation",
        hosted_confirmation: {
          custom_message:
            "Thank you for your payment. Christa Stamper will confirm receipt shortly.",
        },
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: paymentLink.url }),
    };
  } catch (err) {
    console.error("Stripe error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

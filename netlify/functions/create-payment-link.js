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
    const { amount, description, invoiceNumber, method } = JSON.parse(event.body);

    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid amount" }),
      };
    }

    // "card" charges by debit/credit card; "bank" charges via ACH direct debit (US bank account),
    // which has no processing fee, so it gets its own link at the un-marked-up amount.
    const paymentMethodTypes = method === "bank" ? ["us_bank_account"] : ["card"];

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const price = await stripe.prices.create({
      currency: "usd",
      unit_amount: Math.round(amount * 100),
      product_data: {
        name: description || "Biblical Counseling Session",
        metadata: { invoice_number: invoiceNumber || "", payment_method: method || "card" },
      },
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      payment_method_types: paymentMethodTypes,
      metadata: { invoice_number: invoiceNumber || "", payment_method: method || "card" },
      after_completion: {
        type: "hosted_confirmation",
        hosted_confirmation: {
          custom_message: "Thank you for your payment. Christa Stamper will confirm receipt shortly.",
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

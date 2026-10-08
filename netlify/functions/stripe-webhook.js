// Listens for Stripe payment confirmations and marks the matching invoice
// "Paid" in the Invoices Google Sheet. This keeps all Stripe credentials on
// the website (same as create-payment-link.js) — the Apps Script reminder
// job on the sheet side never touches Stripe directly, it just reads the
// "status" column this function writes to.
//
// SETUP
// 1. In the Stripe Dashboard: Developers > Webhooks > Add endpoint.
//      Endpoint URL: https://christastamper.com/.netlify/functions/stripe-webhook
//      Events to send: payment_intent.succeeded
//    (Metadata set on a Payment Link at creation time, like the invoice_number
//    set in create-payment-link.js, is copied onto the resulting PaymentIntent
//    for a one-time payment — that's what this function reads.)
//    After creating it, Stripe shows a signing secret starting "whsec_...".
//
// 2. In Netlify: Site settings > Environment variables, add:
//      STRIPE_WEBHOOK_SECRET          the whsec_... value from step 1
//      GOOGLE_SERVICE_ACCOUNT_EMAIL   see step 3
//      GOOGLE_SERVICE_ACCOUNT_KEY     see step 3 (the private_key field, as-is)
//      GOOGLE_SHEET_ID                the Invoices spreadsheet's ID (the long
//                                     id in its URL between /d/ and /edit)
//    STRIPE_SECRET_KEY should already be set from create-payment-link.js.
//
// 3. Create a Google Cloud service account with Sheets API access:
//      - console.cloud.google.com > a project > "APIs & Services" > enable
//        the "Google Sheets API"
//      - "IAM & Admin" > "Service Accounts" > Create service account
//      - Open it > Keys > Add key > Create new key > JSON. Open that file:
//        GOOGLE_SERVICE_ACCOUNT_EMAIL is its "client_email" field,
//        GOOGLE_SERVICE_ACCOUNT_KEY is its "private_key" field.
//      - Open the Invoices Google Sheet > Share > add that client_email as
//        an Editor. Without this share step the function can see the sheet
//        but can't write to it.
//
// 4. `npm install` inside netlify/functions (this adds the googleapis
//    package used below) and redeploy.

const Stripe = require("stripe");
const { google } = require("googleapis");

const SHEET_NAME = "Invoices";

exports.handler = async (event) => {
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = event.headers["stripe-signature"];

  let stripeEvent;
  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : event.body;
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook signature verification failed: ${err.message}` };
  }

  if (stripeEvent.type === "payment_intent.succeeded") {
    const paymentIntent = stripeEvent.data.object;
    const invoiceNumber = paymentIntent.metadata && paymentIntent.metadata.invoice_number;

    if (invoiceNumber) {
      try {
        await markInvoicePaid(invoiceNumber);
      } catch (err) {
        // Log and still return 200 — returning an error here makes Stripe
        // retry the webhook repeatedly, which won't fix a sheet/auth problem.
        // Check the Netlify function logs if a row doesn't update.
        console.error(`Failed to mark invoice ${invoiceNumber} paid:`, err.message);
      }
    } else {
      console.warn("payment_intent.succeeded with no invoice_number in metadata:", paymentIntent.id);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};

async function markInvoicePaid(invoiceNumber) {
  const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "").replace(/\\n/g, "\n");
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    privateKey,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:Z1000`,
  });

  const rows = data.values || [];
  if (rows.length === 0) throw new Error(`"${SHEET_NAME}" sheet appears empty`);

  const headers = rows[0];
  const invoiceCol = headers.indexOf("invoice_number");
  const statusCol = headers.indexOf("status");
  if (invoiceCol === -1 || statusCol === -1) {
    throw new Error(`"${SHEET_NAME}" sheet is missing an invoice_number or status column`);
  }

  const rowIndex = rows.findIndex((row, i) => i > 0 && row[invoiceCol] === invoiceNumber);
  if (rowIndex === -1) {
    throw new Error(`No row found for invoice ${invoiceNumber}`);
  }

  const statusColumnLetter = columnLetter_(statusCol);
  const sheetRowNumber = rowIndex + 1; // 1-indexed, matches the sheet's own row numbers

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!${statusColumnLetter}${sheetRowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [["Paid"]] },
  });
}

function columnLetter_(index) {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

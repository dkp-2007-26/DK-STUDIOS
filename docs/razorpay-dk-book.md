# Razorpay for DK STUDIOS

This site uses the DK STUDIOS Razorpay account through the Netlify Studio API. The browser opens Razorpay Checkout, but the order is only marked paid after the server verifies the Razorpay signature.

## Environment

Set these in the Netlify deployment used by the site:

```powershell
RAZORPAY_KEY_ID="rzp_live_or_test_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
```

Do not put `RAZORPAY_KEY_SECRET` in browser-visible `VITE_` variables. The key id is returned by the Netlify function because it is safe for the browser, but the secret stays server-side.

## Razorpay Dashboard

1. Use the DK STUDIOS Razorpay account.
2. Add the deployed website domain in Razorpay if domain whitelisting is enabled for the account.
3. Create API keys in the same mode you want to test or run live.
4. If webhooks are added later, point them at a Netlify function dedicated to Razorpay events.

Enable at least these events:

```text
payment.captured
payment.failed
```

## Flow

1. Customer creates an order and uploads files to Google Drive.
2. The Netlify Studio API creates a Razorpay order for the advance amount.
3. The browser opens Razorpay Checkout with the Razorpay order id.
4. On success, the Netlify Studio API verifies `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
5. The order is marked paid only after verification.
6. A webhook function can provide a backup path if the customer closes the page after payment.

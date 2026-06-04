# Qikink Home Delivery

DK STUDIOS keeps in-store pickup as the default fulfillment option. Printed
orders can also choose home delivery, which stores the delivery address on the
server-side order record and queues a Qikink fulfillment job.

## Netlify Environment

Set these only in Netlify or local server `.env` files:

```bash
QIKINK_CLIENT_ID="your_qikink_client_id"
QIKINK_CLIENT_SECRET="your_qikink_client_secret"
QIKINK_API_BASE_URL="https://sandbox.qikink.com"
QIKINK_AUTO_SUBMIT="false"
```

`QIKINK_AUTO_SUBMIT` is intentionally off by default. The app queues a
fulfillment job with the order payload so staff can review it while the exact
Qikink order-create endpoint is confirmed from the dashboard documentation.
Once the endpoint contract is verified, turn auto-submit on and update
`QIKINK_API_BASE_URL` if Qikink provides a different production API host.

Never expose the Qikink client secret in Vite variables.

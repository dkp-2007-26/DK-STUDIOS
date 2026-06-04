# Free Data Collection And Retention

This project does not need Telegram for production intake.

Use the website order form as the free collection path:

1. Customer creates an account and places an order.
2. Supabase stores customer, order, payment, review, and notification metadata.
3. Google Drive stores uploaded files.
4. Admin or delivery staff marks the product delivered.
5. File cleanup can be handled by a Netlify scheduled function or staff process.

## What Gets Deleted

After delivery, uploaded order files are deleted from Google Drive and the related
`order_photos` metadata is removed from Supabase. The order itself stays in Supabase
for invoices, revenue reports, support, and delivery history.

## Required Production Settings

Keep one local `.env` file for development. For production, copy the same values
into the matching Netlify environment variable screen.

Set these in Netlify for upload:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_DRIVE_UPLOAD_MAX_BYTES=52428800
```

Use a dedicated Google account or folder for order uploads. The app stores
Google Drive file IDs, then deletes those IDs from Drive after delivery.

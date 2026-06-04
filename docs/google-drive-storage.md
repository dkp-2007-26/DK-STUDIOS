# Google Drive Storage Setup

This project uses Supabase for order/customer data and Google Drive for uploaded
order files.

## Runtime Flow

1. The customer uploads files through the website order form.
2. `/.netlify/functions/google-drive-upload` validates the signed-in session.
3. The Netlify function uploads the file to `GOOGLE_DRIVE_FOLDER_ID`.
4. The Netlify Studio API stores the Google Drive file ID with the Supabase
   order photo record.
5. Admin and delivery workflows read the stored Google Drive metadata through
   Supabase.

## Local `.env`

Use one local env file: `.env`.

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_DRIVE_UPLOAD_MAX_BYTES=52428800
```

Use the anon key in browser-visible `VITE_` variables and keep the service role
key server-side only.

## Netlify Environment Variables

Set these in Netlify for uploads:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_DRIVE_UPLOAD_MAX_BYTES=52428800
```

## Getting OAuth Values

Use a dedicated Google account or shared drive folder for production order
uploads.

1. Create or open a Google Cloud project.
2. Enable the Google Drive API.
3. Configure the OAuth consent screen.
4. Create an OAuth client for a server/backend flow and copy its client ID and
   client secret.
5. Generate a refresh token for the same Google account with Drive access.
6. Create a Drive folder for uploads and copy the folder ID from its URL.

Store the client ID in `GOOGLE_CLIENT_ID`, the client secret in
`GOOGLE_CLIENT_SECRET`, the refresh token in `GOOGLE_REFRESH_TOKEN`, and the
folder ID in `GOOGLE_DRIVE_FOLDER_ID`.

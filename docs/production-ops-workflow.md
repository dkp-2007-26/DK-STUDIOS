# DK STUDIOS Production Workflow

## Current Implemented Flow

1. Customer creates a request on the website.
2. Files upload to Google Drive.
3. A fixed Rs. 49 online advance is required through DK BOOK Razorpay.
4. The studio/admin notification is sent after Razorpay signature verification.
5. Admin opens the PC admin page, views order details, downloads original Drive files, downloads the bill, and uses the barcode.
6. The DKSTUDIOS app supports admin and delivery staff roles from the same Supabase backend.
7. Delivery staff scan the customer barcode using the rear camera.
8. At pickup, the app shows the remaining balance.
9. Cash pickup can be confirmed on-device.
10. UPI pickup can use a single-use fixed-amount Razorpay QR and wait for server-side confirmation.
11. Confirmed pickup marks the order complete and schedules uploaded file deletion.

## Windows Print Agent Plan

The Windows print app should be a separate local desktop agent because printing must talk to the shop laptop and installed printers directly.

Required local settings:

- `COLOR_PRINTER_NAME`: exact Windows printer name for colour work.
- `BW_PRINTER_NAME`: exact Windows printer name for black-and-white work.
- `DOWNLOAD_FOLDER`: local folder where the agent stores order files before printing.
- `SUPABASE_URL`: same backend URL as the website and DKSTUDIOS app.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only key for secure download and print-job APIs.
- Staff login/session storage for admin-only access.

Expected behavior:

1. Agent shows ready-to-print paid orders.
2. Admin selects an order or enables automatic printing.
3. Agent downloads original files from Google Drive through the secure backend download endpoint.
4. Agent detects print mode from order notes/service/template:
   - black-and-white goes to `BW_PRINTER_NAME`
   - colour goes to `COLOR_PRINTER_NAME`
5. Before printing, it shows a confirmation popup with customer, bill number, print mode, printer, file count, and frame requirement.
6. If the laptop is disconnected from a printer, or Windows reports the job is queued/not printed, the agent keeps the job in a local retry queue.
7. If framing is required, the order remains in a framed-pending state and delivery is delayed by 1-2 days.

Recommended stack:

- Tauri or Electron for the Windows desktop shell.
- Node or Rust print bridge for Windows printer listing and job submission.
- Supabase for order state.
- Local SQLite or JSON queue for print retry state.

Do not hard-code printer names. The first version should include a printer setup screen and a test-print button for each printer.

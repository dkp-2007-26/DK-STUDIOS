# Supplier Routing

DK STUDIOS routes printed-product fulfillment with a strict supplier policy:

- Photo Frame, Standard: Local supplier.
- Photo Frame, Premium: Vistaprint.
- Every other printed product: Vistaprint only.
- Digital-only orders: no external supplier.

There are no backup online suppliers in the active routing model.

When new products are added, set their service category/name/code clearly. Any
service whose category/name/code/description contains `photo frame`,
`photoframe`, or `frame` is treated as a photo-frame product and shows the
Standard/Premium choice. Other printed services are routed to Vistaprint.

Supplier jobs are stored in `supplier_fulfillment_jobs` for staff handling.
The system stores the customer order, final-upload metadata, delivery address,
and selected supplier route. Automatic Vistaprint order submission is not enabled
unless Vistaprint provides a supported partner/API workflow.

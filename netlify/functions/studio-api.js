import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseServiceClient, requireRazorpayEnv, requireRole, SupabaseServerError } from "../lib/supabase-server.js";
import { createSupplierFulfillmentJob, resolveSupplierRoute } from "../lib/supplier-fulfillment.js";
import {
  captureFunctionError,
  flushGlitchTip,
  initGlitchTip,
  safeErrorMessage,
  shouldReportError,
} from "../lib/glitchtip.js";

initGlitchTip({ surface: "studio-api" });

const barcodeBaseUrl = "https://quickchart.io/barcode";
const mandatoryAdvanceAmount = 49;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function readJson(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new SupabaseServerError("JSON body is required.", 400);
  }
  return await request.json();
}

function getBearerToken(request, body) {
  const header = request.headers.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return String(body.accessToken || body.sessionToken || "");
}

function toOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    service_id: row.service_code,
    template_id: row.template_code,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    customer_phone: row.customer_phone,
    fulfillment_method: row.fulfillment_method ?? "pickup",
    shipping_name: row.shipping_name,
    shipping_phone: row.shipping_phone,
    shipping_address_line1: row.shipping_address_line1,
    shipping_address_line2: row.shipping_address_line2,
    shipping_city: row.shipping_city,
    shipping_state: row.shipping_state,
    shipping_pincode: row.shipping_pincode,
    shipping_country: row.shipping_country,
    instructions: row.instructions,
    frame_option: row.frame_option,
    frame_size: row.frame_size,
    collage_preference: row.collage_preference,
    personalization_text: row.personalization_text,
    photo_count: row.photo_count ?? 0,
    photo_names: row.photo_names ?? [],
    google_drive_folder_id: row.google_drive_folder_id,
    delivery_type: row.delivery_type,
    status: row.status,
    payment_status: row.payment_status,
    payment_provider: row.payment_provider,
    payment_order_id: row.payment_order_id,
    payment_id: row.payment_id,
    payment_link_url: row.payment_link_url,
    subtotal_amount: Number(row.subtotal_amount ?? row.total_amount ?? 0),
    discount_code: row.discount_code,
    discount_percentage: row.discount_percentage === null ? null : Number(row.discount_percentage),
    discount_amount: row.discount_amount === null ? null : Number(row.discount_amount),
    total_amount: Number(row.total_amount ?? 0),
    advance_amount: Number(row.advance_amount ?? mandatoryAdvanceAmount),
    advance_amount_paise: Math.round(Number(row.advance_amount ?? mandatoryAdvanceAmount) * 100),
    admin_notes: row.admin_notes,
    barcode_value: row.barcode_value,
    barcode_url: row.barcode_url,
    tracking_url: row.tracking_url,
    bill_number: row.bill_number,
    review_token: row.review_token,
    payment_completed_at: row.payment_completed_at,
    completed_at: row.completed_at,
    delivered_at: row.delivered_at,
    pickup_ready_at: row.pickup_ready_at,
    pickup_ready_by: row.pickup_ready_by,
    pickup_ready_notified_at: row.pickup_ready_notified_at,
    pickup_completed_at: row.pickup_completed_at,
    last_barcode_scanned_at: row.last_barcode_scanned_at,
    barcode_scan_count: row.barcode_scan_count ?? 0,
    customer_notified_at: row.customer_notified_at,
    review_request_sent_at: row.review_request_sent_at,
    review_submitted_at: row.review_submitted_at,
    delivery_verified_by: row.delivery_verified_by,
    file_retention_status: row.file_retention_status ?? "skipped",
    files_deletion_scheduled_at: row.files_deletion_scheduled_at,
    files_deleted_at: row.files_deleted_at,
    files_deletion_failed_at: row.files_deletion_failed_at,
    files_deletion_error: row.files_deletion_error,
    supplier: row.supplier ?? "none",
    supplier_status: row.supplier_status ?? "not_required",
    supplier_order_id: row.supplier_order_id,
    supplier_submitted_at: row.supplier_submitted_at,
    supplier_error: row.supplier_error,
    frame_fulfillment_tier: row.frame_fulfillment_tier,
    product_kind: row.product_kind,
    qikink_status: row.qikink_status ?? "not_required",
    qikink_order_id: row.qikink_order_id,
    qikink_submitted_at: row.qikink_submitted_at,
    qikink_error: row.qikink_error,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toService(row) {
  return {
    id: row.code,
    name: row.name,
    description: row.description,
    base_price: Number(row.base_price ?? 0),
    print_price: Number(row.print_price ?? 0),
    category: row.category,
    is_active: row.is_active,
    sort_order: row.sort_order,
    created_at: row.created_at,
  };
}

function toTemplate(row) {
  return {
    id: row.code,
    name: row.name,
    category: row.category,
    description: row.description,
    image_url: row.image_url,
    tag: row.tag,
    is_active: row.is_active,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toPromotion(row) {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discount_percentage: Number(row.discount_percentage ?? 0),
    max_uses: row.max_uses,
    uses_count: row.uses_count,
    valid_until: row.valid_until,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toReview(row) {
  return {
    id: row.id,
    order_id: row.order_id,
    user_id: row.user_id,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    public_location: row.public_location,
    rating: row.rating,
    message: row.message,
    status: row.status,
    review_token: row.review_token,
    requested_at: row.requested_at,
    submitted_at: row.submitted_at,
    approved_at: row.approved_at,
    rejected_at: row.rejected_at,
    admin_notes: row.admin_notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toPhoto(row) {
  return {
    id: row.id,
    order_id: row.order_id,
    user_id: row.user_id,
    file_name: row.file_name,
    file_url: row.google_drive_thumbnail_link || row.google_drive_web_view_link || row.preview_url || "",
    storage_provider: row.storage_provider,
    google_drive_file_id: row.google_drive_file_id,
    google_drive_web_view_link: row.google_drive_web_view_link,
    google_drive_web_content_link: row.google_drive_web_content_link,
    file_size: Number(row.file_size ?? 0),
    sort_order: row.sort_order,
    created_at: row.created_at,
  };
}

function toPrintJob(row) {
  return {
    id: row.id,
    order_id: row.order_id,
    source_type: row.source_type,
    title: row.title,
    file_name: row.file_name,
    file_size: Number(row.file_size ?? 0),
    mime_type: row.mime_type,
    google_drive_file_id: row.google_drive_file_id,
    google_drive_folder_id: row.google_drive_folder_id,
    google_drive_web_view_link: row.google_drive_web_view_link,
    google_drive_web_content_link: row.google_drive_web_content_link,
    google_drive_thumbnail_link: row.google_drive_thumbnail_link,
    preview_url: row.preview_url,
    target: row.target,
    copies: row.copies,
    notes: row.notes,
    status: row.status,
    requested_by_user_id: row.requested_by_user_id,
    requested_by_email: row.requested_by_email,
    desktop_device_id: row.desktop_device_id,
    desktop_device_name: row.desktop_device_name,
    desktop_claimed_at: row.desktop_claimed_at,
    print_started_at: row.print_started_at,
    printed_at: row.printed_at,
    failed_at: row.failed_at,
    error_message: row.error_message,
    is_reprint: row.is_reprint,
    parent_print_job_id: row.parent_print_job_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function buildBarcodeUrl(text) {
  const params = new URLSearchParams({
    type: "code128",
    text,
    format: "svg",
    includeText: "true",
    width: "360",
    height: "120",
  });
  return `${barcodeBaseUrl}?${params.toString()}`;
}

function makeBillNumber() {
  return `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function createBasicAuthHeader(keyId, keySecret) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

function createRazorpayPaymentSignature(providerOrderId, providerPaymentId, keySecret) {
  return createHmac("sha256", keySecret).update(`${providerOrderId}|${providerPaymentId}`).digest("hex");
}

function timingSafeEqualHex(left, right) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizeFulfillment(body) {
  const deliveryType = body.deliveryType || "digital";
  const requested = body.fulfillmentMethod === "home_delivery" ? "home_delivery" : "pickup";
  const fulfillmentMethod = deliveryType === "printed" ? requested : "pickup";
  const address = body.shippingAddress && typeof body.shippingAddress === "object" ? body.shippingAddress : {};
  if (fulfillmentMethod === "home_delivery") {
    const required = {
      shipping_name: String(address.name || body.customerName || "").trim(),
      shipping_phone: String(address.phone || body.customerPhone || "").trim(),
      shipping_address_line1: String(address.addressLine1 || "").trim(),
      shipping_city: String(address.city || "").trim(),
      shipping_state: String(address.state || "").trim(),
      shipping_pincode: String(address.pincode || "").trim(),
      shipping_country: String(address.country || "India").trim(),
    };
    if (Object.values(required).some((value) => !value)) {
      throw new SupabaseServerError("Home delivery needs name, phone, address, city, state, pincode, and country.", 400);
    }
    return {
      fulfillment_method: fulfillmentMethod,
      ...required,
      shipping_address_line2: address.addressLine2 ? String(address.addressLine2).trim() : null,
      qikink_status: "not_required",
    };
  }
  return {
    fulfillment_method: "pickup",
    shipping_name: null,
    shipping_phone: null,
    shipping_address_line1: null,
    shipping_address_line2: null,
    shipping_city: null,
    shipping_state: null,
    shipping_pincode: null,
    shipping_country: null,
    qikink_status: "not_required",
  };
}

async function previewPromotion(supabase, promoCode, subtotalAmount) {
  if (!promoCode) return null;
  const { data: promotion, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("code", String(promoCode).toUpperCase())
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new SupabaseServerError(error.message, 500);
  if (!promotion) return null;
  if (promotion.valid_until && new Date(promotion.valid_until).getTime() < Date.now()) return null;
  if (promotion.max_uses !== null && promotion.max_uses !== undefined && promotion.uses_count >= promotion.max_uses) return null;
  const discountAmount = Number(((Number(subtotalAmount) * Number(promotion.discount_percentage)) / 100).toFixed(2));
  return {
    code: promotion.code,
    description: promotion.description,
    discount_percentage: Number(promotion.discount_percentage),
    discount_amount: discountAmount,
    total_amount: Math.max(Number(subtotalAmount) - discountAmount, 0),
    valid_until: promotion.valid_until,
  };
}

async function listPublic(supabase) {
  const [services, templates, testimonials] = await Promise.all([
    supabase.from("services").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("templates").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("testimonials").select("*").eq("is_active", true).order("sort_order"),
  ]);
  for (const result of [services, templates, testimonials]) {
    if (result.error) throw new SupabaseServerError(result.error.message, 500);
  }
  return {
    services: services.data.map(toService),
    templates: templates.data.map(toTemplate),
    testimonials: testimonials.data.map((item) => ({
      id: item.id,
      name: item.name,
      location: item.location,
      message: item.message,
      rating: item.rating,
    })),
  };
}

async function createOrder(supabase, body) {
  const promo = await previewPromotion(supabase, body.promoCode, Number(body.subtotalAmount ?? body.totalAmount ?? 0));
  const subtotal = Number(body.subtotalAmount ?? body.totalAmount ?? 0);
  const total = promo?.total_amount ?? Number(body.totalAmount ?? subtotal);
  if (Math.abs(Number(body.advanceAmount) - mandatoryAdvanceAmount) > 0.01) {
    throw new SupabaseServerError(`Rs. ${mandatoryAdvanceAmount} online advance is required to submit this request.`, 400);
  }
  if (Math.abs(Number(body.totalAmount) - total) > 0.01) {
    throw new SupabaseServerError("Order total no longer matches the selected promotion.", 400);
  }

  let userId = null;
  const email = String(body.customerEmail || "").trim().toLowerCase();
  const { data: existingUser, error: existingUserError } = await supabase
    .from("app_users")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (existingUserError) throw new SupabaseServerError(existingUserError.message, 500);
  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: guest, error } = await supabase
      .from("app_users")
      .insert({
        email: email || `guest-${Date.now()}@dk-studios.local`,
        display_name: String(body.customerName || "Guest Customer"),
        password_hash: null,
        is_admin: false,
        role: "customer",
      })
      .select("*")
      .single();
    if (error) throw new SupabaseServerError(error.message, 500);
    userId = guest.id;
  }

  const barcodeValue = `DK-${Date.now()}`;
  const barcodeUrl = buildBarcodeUrl(barcodeValue);
  const billNumber = makeBillNumber();
  const reviewToken = `rvw_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const photoAssets = Array.isArray(body.photoAssets) ? body.photoAssets : [];
  const fulfillment = normalizeFulfillment(body);
  const supplierRoute = await resolveSupplierRoute(supabase, body);
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      service_code: body.serviceCode,
      template_code: body.templateCode || null,
      customer_name: body.customerName,
      customer_email: email,
      customer_phone: body.customerPhone || null,
      ...fulfillment,
      ...supplierRoute,
      instructions: body.instructions || null,
      frame_option: body.frameOption || null,
      frame_size: body.frameSize || null,
      collage_preference: body.collagePreference || null,
      personalization_text: body.personalizationText || null,
      photo_count: Number(body.photoCount || photoAssets.length || 0),
      photo_names: Array.isArray(body.photoNames) ? body.photoNames : [],
      google_drive_folder_id: photoAssets[0]?.googleDriveFolderId || null,
      delivery_type: body.deliveryType || "digital",
      status: "pending",
      payment_status: "pending",
      payment_provider: "razorpay",
      subtotal_amount: subtotal,
      discount_code: promo?.code || null,
      discount_percentage: promo?.discount_percentage ?? null,
      discount_amount: promo?.discount_amount ?? null,
      total_amount: total,
      advance_amount: mandatoryAdvanceAmount,
      admin_notes: null,
      barcode_value: barcodeValue,
      barcode_url: barcodeUrl,
      tracking_url: `${barcodeUrl}&label=${encodeURIComponent(billNumber)}`,
      bill_number: billNumber,
      review_token: reviewToken,
      file_retention_status: photoAssets.length > 0 ? "retained" : "skipped",
    })
    .select("*")
    .single();
  if (orderError) throw new SupabaseServerError(orderError.message, 500);

  if (photoAssets.length > 0) {
    const { error } = await supabase.from("order_photos").insert(photoAssets.map((photo, index) => ({
      order_id: order.id,
      user_id: userId,
      storage_provider: "google_drive",
      file_name: photo.fileName,
      file_size: photo.fileSize,
      mime_type: photo.mimeType,
      google_drive_file_id: photo.googleDriveFileId || null,
      google_drive_folder_id: photo.googleDriveFolderId || null,
      google_drive_web_view_link: photo.googleDriveWebViewLink || null,
      google_drive_web_content_link: photo.googleDriveWebContentLink || null,
      google_drive_thumbnail_link: photo.googleDriveThumbnailLink || null,
      preview_url: photo.previewUrl || null,
      sort_order: photo.sortOrder ?? index,
      crop_x: photo.cropX ?? null,
      crop_y: photo.cropY ?? null,
      crop_width: photo.cropWidth ?? null,
      crop_height: photo.cropHeight ?? null,
    })));
    if (error) throw new SupabaseServerError(error.message, 500);
  }

  const { error: reviewError } = await supabase.from("reviews").insert({
    order_id: order.id,
    user_id: userId,
    customer_name: body.customerName,
    customer_email: email,
    rating: 5,
    message: "",
    status: "pending",
    review_token: reviewToken,
  });
  if (reviewError) throw new SupabaseServerError(reviewError.message, 500);

  if (promo?.code) {
    await supabase.rpc("increment_promotion_use", { promo_code: promo.code }).catch(() => null);
  }

  await createSupplierFulfillmentJob(supabase, order, {
    serviceCode: body.serviceCode,
    templateCode: body.templateCode || null,
    photoAssets,
  });

  return toOrder(order);
}

async function getOrderById(supabase, orderId) {
  const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw new SupabaseServerError(error.message, 500);
  return toOrder(data);
}

async function createRazorpayCheckout(supabase, orderId) {
  const { keyId, keySecret } = requireRazorpayEnv();
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (error || !order) throw new SupabaseServerError("Order not found.", 404);
  if (order.payment_status === "paid") {
    return {
      already_paid: true,
      provider_order_id: order.payment_order_id || "",
      key_id: keyId,
      amount_paise: Math.round(Number(order.advance_amount) * 100),
      currency: "INR",
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      receipt: order.bill_number || order.id,
    };
  }
  if (order.payment_order_id?.startsWith("order_")) {
    return {
      already_paid: false,
      provider_order_id: order.payment_order_id,
      key_id: keyId,
      amount_paise: Math.round(Number(order.advance_amount) * 100),
      currency: "INR",
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      receipt: order.bill_number || order.id,
    };
  }
  const amountPaise = Math.round(Number(order.advance_amount) * 100);
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: createBasicAuthHeader(keyId, keySecret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: String(order.bill_number || order.id).slice(0, 40),
      notes: {
        dk_studios_order_id: order.id,
        bill_number: order.bill_number,
        account: "DK STUDIOS",
      },
    }),
  });
  if (!response.ok) {
    throw new SupabaseServerError(`Razorpay order creation failed (${response.status}): ${(await response.text()).slice(0, 300)}`, 502);
  }
  const razorpayOrder = await response.json();
  const now = new Date().toISOString();
  const update = await supabase
    .from("orders")
    .update({ payment_order_id: razorpayOrder.id, payment_provider: "razorpay", updated_at: now })
    .eq("id", order.id);
  if (update.error) throw new SupabaseServerError(update.error.message, 500);
  const payment = await supabase.from("payments").upsert({
    order_id: order.id,
    user_id: order.user_id,
    provider: "razorpay",
    provider_order_id: razorpayOrder.id,
    status: "created",
    amount: Number(order.advance_amount),
    currency: razorpayOrder.currency,
    receipt: order.bill_number || order.id,
    metadata_summary: `Advance payment for ${order.bill_number || order.id}`,
  }, { onConflict: "provider_order_id" });
  if (payment.error) throw new SupabaseServerError(payment.error.message, 500);
  return {
    already_paid: false,
    provider_order_id: razorpayOrder.id,
    key_id: keyId,
    amount_paise: amountPaise,
    currency: razorpayOrder.currency,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    receipt: order.bill_number || order.id,
  };
}

async function verifyRazorpayPayment(supabase, body) {
  const { keySecret } = requireRazorpayEnv();
  const expected = createRazorpayPaymentSignature(body.providerOrderId, body.providerPaymentId, keySecret);
  if (!timingSafeEqualHex(expected, body.providerSignature)) {
    throw new SupabaseServerError("Razorpay payment signature verification failed.", 400);
  }
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", body.orderId).single();
  if (error || !order || order.payment_order_id !== body.providerOrderId) {
    throw new SupabaseServerError("Razorpay order id does not match this order.", 400);
  }
  const now = new Date().toISOString();
  const payment = await supabase
    .from("payments")
    .update({
      provider_payment_id: body.providerPaymentId,
      provider_signature: body.providerSignature,
      status: "paid",
      amount: Number(order.advance_amount),
      updated_at: now,
    })
    .eq("provider_order_id", body.providerOrderId);
  if (payment.error) throw new SupabaseServerError(payment.error.message, 500);
  const orderUpdate = await supabase
    .from("orders")
    .update({
      status: order.status === "pending" ? "confirmed" : order.status,
      payment_status: "paid",
      payment_id: body.providerPaymentId,
      payment_completed_at: now,
      updated_at: now,
    })
    .eq("id", order.id);
  if (orderUpdate.error) throw new SupabaseServerError(orderUpdate.error.message, 500);
  return { ok: true, order_id: order.id, provider_order_id: body.providerOrderId, provider_payment_id: body.providerPaymentId };
}

async function adminSnapshot(supabase) {
  const [orders, printJobs, services, promotions, reviews] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(250),
    supabase.from("print_jobs").select("*").order("created_at", { ascending: false }).limit(250),
    supabase.from("services").select("*").order("sort_order"),
    supabase.from("promotions").select("*").order("created_at", { ascending: false }),
    supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(250),
  ]);
  for (const result of [orders, printJobs, services, promotions, reviews]) {
    if (result.error) throw new SupabaseServerError(result.error.message, 500);
  }
  const serializedOrders = orders.data.map(toOrder);
  const paid = serializedOrders.filter((order) => order.payment_status === "paid");
  const monthly = new Map();
  const servicesMap = new Map(services.data.map((service) => [service.code, service.name]));
  const popularServices = new Map();
  for (const order of serializedOrders) {
    const key = new Date(order.created_at).toISOString().slice(0, 7);
    const bucket = monthly.get(key) || { month: key, orders: 0, revenue: 0 };
    bucket.orders += 1;
    bucket.revenue += order.payment_status === "paid" ? order.total_amount : 0;
    monthly.set(key, bucket);
    const serviceName = servicesMap.get(order.service_id || "") || order.service_id || "Custom";
    popularServices.set(serviceName, (popularServices.get(serviceName) || 0) + 1);
  }
  return {
    orders: serializedOrders,
    printJobs: printJobs.data.map(toPrintJob),
    services: services.data.map(toService),
    promotions: promotions.data.map(toPromotion),
    reviews: reviews.data.map(toReview),
    analytics: {
      monthly_revenue: Array.from(monthly.values()).slice(-12),
      popular_services: Array.from(popularServices.entries()).map(([name, count]) => ({ code: name, name, count })),
      popular_templates: [],
      kpis: {
        total_orders: serializedOrders.length,
        paid_orders: paid.length,
        pending_orders: serializedOrders.filter((order) => order.status === "pending").length,
        paid_revenue: paid.reduce((sum, order) => sum + order.total_amount, 0),
      },
    },
  };
}

async function updateOrder(supabase, body) {
  const patch = {};
  if (body.status) patch.status = body.status;
  if (body.paymentStatus) {
    patch.payment_status = body.paymentStatus;
    patch.payment_completed_at = body.paymentStatus === "paid" ? new Date().toISOString() : null;
  }
  if ("adminNotes" in body) patch.admin_notes = body.adminNotes || null;
  const { data, error } = await supabase.from("orders").update(patch).eq("id", body.orderId).select("*").single();
  if (error) throw new SupabaseServerError(error.message, 500);
  return toOrder(data);
}

async function upsertService(supabase, body) {
  const { error } = await supabase.from("services").upsert({
    code: body.code,
    name: body.name,
    description: body.description || null,
    base_price: Number(body.basePrice ?? body.base_price ?? 0),
    print_price: Number(body.printPrice ?? body.print_price ?? 0),
    category: body.category || "print",
    is_active: Boolean(body.isActive ?? body.is_active ?? true),
    sort_order: Number(body.sortOrder ?? body.sort_order ?? 0),
  }, { onConflict: "code" });
  if (error) throw new SupabaseServerError(error.message, 500);
  return { ok: true };
}

async function upsertPromotion(supabase, body) {
  const { error } = await supabase.from("promotions").upsert({
    code: String(body.code || "").toUpperCase(),
    description: body.description || null,
    discount_percentage: Number(body.discountPercentage ?? body.discount ?? 0),
    max_uses: body.maxUses === null || body.maxUses === "" ? null : Number(body.maxUses ?? 100),
    valid_until: body.validUntil || null,
    is_active: Boolean(body.isActive ?? true),
  }, { onConflict: "code" });
  if (error) throw new SupabaseServerError(error.message, 500);
  return { ok: true };
}

async function createPrintJob(supabase, body, appUser) {
  const file = body.file || {};
  const { data, error } = await supabase.from("print_jobs").insert({
    order_id: body.orderId || null,
    source_type: body.orderId ? "final_artwork" : "manual",
    title: body.title || file.fileName || "Print job",
    file_name: file.fileName,
    file_size: file.fileSize,
    mime_type: file.mimeType,
    google_drive_file_id: file.googleDriveFileId,
    google_drive_folder_id: file.googleDriveFolderId || null,
    google_drive_web_view_link: file.googleDriveWebViewLink || null,
    google_drive_web_content_link: file.googleDriveWebContentLink || null,
    google_drive_thumbnail_link: file.googleDriveThumbnailLink || null,
    preview_url: file.previewUrl || null,
    target: body.target || "auto",
    copies: Number(body.copies || 1),
    notes: body.notes || null,
    status: "queued",
    requested_by_user_id: appUser.id,
    requested_by_email: appUser.email,
    is_reprint: Boolean(body.isReprint),
    parent_print_job_id: body.parentPrintJobId || null,
  }).select("*").single();
  if (error) throw new SupabaseServerError(error.message, 500);
  return toPrintJob(data);
}

async function getReviewByToken(supabase, reviewToken) {
  const { data, error } = await supabase.from("reviews").select("*").eq("review_token", reviewToken).maybeSingle();
  if (error) throw new SupabaseServerError(error.message, 500);
  return data ? toReview(data) : null;
}

async function submitReview(supabase, body) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("reviews")
    .update({
      rating: Number(body.rating || 5),
      message: body.message || "",
      public_location: body.publicLocation || null,
      status: "pending",
      submitted_at: now,
    })
    .eq("review_token", body.reviewToken)
    .select("*")
    .single();
  if (error) throw new SupabaseServerError(error.message, 500);
  await supabase.from("orders").update({ review_submitted_at: now }).eq("id", data.order_id);
  return toReview(data);
}

async function deliveryByBarcode(supabase, barcodeValue) {
  const { data, error } = await supabase.from("orders").select("*").eq("barcode_value", String(barcodeValue).trim().toUpperCase()).maybeSingle();
  if (error) throw new SupabaseServerError(error.message, 500);
  return toOrder(data);
}

async function markDelivered(supabase, barcodeValue, staffEmail) {
  const order = await deliveryByBarcode(supabase, barcodeValue);
  if (!order) throw new SupabaseServerError("No order found for this barcode.", 404);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "completed",
      delivered_at: now,
      pickup_completed_at: now,
      completed_at: order.completed_at || now,
      delivery_verified_by: staffEmail,
      customer_notified_at: now,
      last_barcode_scanned_at: now,
      barcode_scan_count: (order.barcode_scan_count || 0) + 1,
    })
    .eq("id", order.id)
    .select("*")
    .single();
  if (error) throw new SupabaseServerError(error.message, 500);
  return toOrder(data);
}

export default async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  const context = { method: request.method };
  try {
    const body = await readJson(request);
    const action = String(body.action || "");
    const token = getBearerToken(request, body);
    const supabase = getSupabaseServiceClient();
    context.action = action;

    if (action === "public.snapshot") return json(await listPublic(supabase));
    if (action === "promotions.preview") return json(await previewPromotion(supabase, body.promoCode, body.subtotalAmount));
    if (action === "orders.create") return json(await createOrder(supabase, body));
    if (action === "orders.getPublic") return json(await getOrderById(supabase, body.orderId));
    if (action === "payments.createRazorpayCheckout") return json(await createRazorpayCheckout(supabase, body.orderId));
    if (action === "payments.verifyRazorpayPayment") return json(await verifyRazorpayPayment(supabase, body));
    if (action === "reviews.getByToken") return json(await getReviewByToken(supabase, body.reviewToken));
    if (action === "reviews.submit") return json(await submitReview(supabase, body));

    if (action.startsWith("admin.")) {
      const { appUser } = await requireRole(token, ["admin"]);
      if (action === "admin.snapshot") return json(await adminSnapshot(supabase));
      if (action === "admin.updateOrder") return json(await updateOrder(supabase, body));
      if (action === "admin.upsertService") return json(await upsertService(supabase, body));
      if (action === "admin.upsertPromotion") return json(await upsertPromotion(supabase, body));
      if (action === "admin.removePromotion") {
        const { error } = await supabase.from("promotions").delete().eq("id", body.promotionId);
        if (error) throw new SupabaseServerError(error.message, 500);
        return json({ ok: true });
      }
      if (action === "admin.moderateReview") {
        const now = new Date().toISOString();
        const { data, error } = await supabase.from("reviews").update({
          status: body.status,
          admin_notes: body.adminNotes || null,
          approved_at: body.status === "approved" ? now : null,
          rejected_at: body.status === "rejected" ? now : null,
        }).eq("id", body.reviewId).select("*").single();
        if (error) throw new SupabaseServerError(error.message, 500);
        return json(toReview(data));
      }
      if (action === "admin.listPhotos") {
        const { data, error } = await supabase.from("order_photos").select("*").eq("order_id", body.orderId).order("sort_order");
        if (error) throw new SupabaseServerError(error.message, 500);
        return json(data.map(toPhoto));
      }
      if (action === "admin.createPrintJob") return json(await createPrintJob(supabase, body, appUser));
      if (action === "admin.cancelPrintJob") {
        const { data, error } = await supabase.from("print_jobs").update({ status: "cancelled" }).eq("id", body.printJobId).select("*").single();
        if (error) throw new SupabaseServerError(error.message, 500);
        return json(toPrintJob(data));
      }
    }

    if (action.startsWith("delivery.")) {
      const { appUser } = await requireRole(token, ["admin", "delivery"]);
      if (action === "delivery.getByBarcode") return json(await deliveryByBarcode(supabase, body.barcodeValue));
      if (action === "delivery.markDelivered") return json(await markDelivered(supabase, body.barcodeValue, appUser.email));
    }

    throw new SupabaseServerError("Unknown action.", 400);
  } catch (error) {
    const status = error instanceof SupabaseServerError ? error.status : 500;
    captureFunctionError(error, {
      functionName: "studio-api",
      status,
      extra: context,
      fingerprint: ["netlify", "studio-api"],
    });
    if (shouldReportError(status)) {
      await flushGlitchTip();
    }
    return json({ error: safeErrorMessage(error, "Studio API failed") }, status);
  }
};

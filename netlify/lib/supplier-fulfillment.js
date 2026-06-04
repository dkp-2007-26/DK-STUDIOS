const supplierLabels = {
  local: "Local",
  vistaprint: "Vistaprint",
};

function isPhotoFrameService(service) {
  const haystack = [
    service?.code,
    service?.name,
    service?.category,
    service?.description,
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes("photo frame") || haystack.includes("photoframe") || haystack.includes("frame");
}

function normalizeFrameTier(value) {
  return value === "local_standard" ? "local_standard" : "vistaprint_premium";
}

export async function resolveSupplierRoute(supabase, body) {
  if (body.deliveryType !== "printed") {
    return {
      supplier: "none",
      supplier_status: "not_required",
      frame_fulfillment_tier: null,
      product_kind: "digital",
    };
  }

  const { data: service, error } = await supabase
    .from("services")
    .select("code,name,category,description")
    .eq("code", body.serviceCode)
    .maybeSingle();
  if (error) throw error;

  const photoFrame = isPhotoFrameService(service);
  const frameTier = photoFrame ? normalizeFrameTier(body.frameFulfillmentTier) : null;
  const supplier = photoFrame && frameTier === "local_standard" ? "local" : "vistaprint";

  return {
    supplier,
    supplier_status: "queued",
    frame_fulfillment_tier: frameTier,
    product_kind: photoFrame ? "photo_frame" : service?.category || body.serviceCode || "print",
  };
}

function buildSupplierPayload(order, metadata) {
  return {
    external_order_id: order.id,
    bill_number: order.bill_number,
    supplier: order.supplier,
    supplier_label: supplierLabels[order.supplier] || order.supplier,
    product_kind: order.product_kind,
    frame_fulfillment_tier: order.frame_fulfillment_tier,
    customer: {
      name: order.customer_name,
      email: order.customer_email,
      phone: order.customer_phone,
    },
    fulfillment: {
      method: order.fulfillment_method,
      recipient_name: order.shipping_name || order.customer_name,
      recipient_phone: order.shipping_phone || order.customer_phone,
      address_line1: order.shipping_address_line1,
      address_line2: order.shipping_address_line2,
      city: order.shipping_city,
      state: order.shipping_state,
      pincode: order.shipping_pincode,
      country: order.shipping_country || "India",
    },
    order: {
      service_code: metadata.serviceCode,
      template_code: metadata.templateCode,
      photo_count: order.photo_count,
      photo_names: order.photo_names || [],
      subtotal_amount: Number(order.subtotal_amount ?? 0),
      total_amount: Number(order.total_amount ?? 0),
      advance_amount: Number(order.advance_amount ?? 0),
    },
    assets: (metadata.photoAssets || []).map((asset) => ({
      file_name: asset.fileName,
      file_size: asset.fileSize,
      mime_type: asset.mimeType,
      google_drive_file_id: asset.googleDriveFileId || null,
      google_drive_web_view_link: asset.googleDriveWebViewLink || null,
      preview_url: asset.previewUrl || null,
    })),
  };
}

export async function createSupplierFulfillmentJob(supabase, order, metadata) {
  if (order.supplier === "none" || order.supplier_status === "not_required") {
    return null;
  }

  const payload = buildSupplierPayload(order, metadata);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("supplier_fulfillment_jobs")
    .insert({
      order_id: order.id,
      supplier: order.supplier,
      status: "queued",
      request_payload: payload,
    })
    .select("*")
    .single();
  if (error) throw error;

  await supabase
    .from("orders")
    .update({
      supplier_status: "queued",
      supplier_error: null,
      updated_at: now,
    })
    .eq("id", order.id);

  return data;
}

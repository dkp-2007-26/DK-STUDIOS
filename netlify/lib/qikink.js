const qikinkDefaultApiBaseUrl = "https://sandbox.qikink.com";

function qikinkCredentialsConfigured() {
  return Boolean(process.env.QIKINK_CLIENT_ID && process.env.QIKINK_CLIENT_SECRET);
}

function getQikinkApiBaseUrl() {
  return (process.env.QIKINK_API_BASE_URL || qikinkDefaultApiBaseUrl).replace(/\/+$/, "");
}

function shouldAutoSubmitQikinkOrders() {
  return process.env.QIKINK_AUTO_SUBMIT === "true";
}

function buildFulfillmentPayload(order, metadata) {
  return {
    external_order_id: order.id,
    bill_number: order.bill_number,
    customer: {
      name: order.shipping_name || order.customer_name,
      email: order.customer_email,
      phone: order.shipping_phone || order.customer_phone,
    },
    shipping_address: {
      name: order.shipping_name,
      phone: order.shipping_phone,
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

async function insertFulfillmentJob(supabase, order, payload) {
  const status = qikinkCredentialsConfigured() ? "queued" : "manual_review";
  const { data, error } = await supabase
    .from("qikink_fulfillment_jobs")
    .insert({
      order_id: order.id,
      status,
      request_payload: payload,
      error_message: qikinkCredentialsConfigured() ? null : "Qikink credentials are not configured in Netlify.",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function markOrderQikinkState(supabase, orderId, patch) {
  await supabase.from("orders").update({
    ...patch,
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);
}

async function trySubmitFulfillmentJob(supabase, job, orderId) {
  if (!qikinkCredentialsConfigured() || !shouldAutoSubmitQikinkOrders()) {
    return job;
  }

  const apiBaseUrl = getQikinkApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": process.env.QIKINK_CLIENT_ID,
      "X-Client-Secret": process.env.QIKINK_CLIENT_SECRET,
    },
    body: JSON.stringify(job.request_payload),
  });
  const responseBody = await response.json().catch(async () => ({ raw: await response.text().catch(() => "") }));
  const now = new Date().toISOString();

  if (!response.ok) {
    const message = `Qikink order submit failed (${response.status}).`;
    await supabase.from("qikink_fulfillment_jobs").update({
      status: "failed",
      response_payload: responseBody,
      error_message: message,
      attempted_at: now,
      updated_at: now,
    }).eq("id", job.id);
    await markOrderQikinkState(supabase, orderId, { qikink_status: "failed", qikink_error: message });
    return { ...job, status: "failed", response_payload: responseBody, error_message: message };
  }

  const providerOrderId = responseBody.order_id || responseBody.id || responseBody.data?.order_id || responseBody.data?.id || null;
  await supabase.from("qikink_fulfillment_jobs").update({
    status: "submitted",
    provider_order_id: providerOrderId,
    response_payload: responseBody,
    attempted_at: now,
    submitted_at: now,
    updated_at: now,
  }).eq("id", job.id);
  await markOrderQikinkState(supabase, orderId, {
    qikink_status: "submitted",
    qikink_order_id: providerOrderId,
    qikink_submitted_at: now,
    qikink_error: null,
  });
  return { ...job, status: "submitted", provider_order_id: providerOrderId, response_payload: responseBody };
}

export async function createQikinkFulfillmentJob(supabase, order, metadata) {
  const payload = buildFulfillmentPayload(order, metadata);
  const job = await insertFulfillmentJob(supabase, order, payload);
  return await trySubmitFulfillmentJob(supabase, job, order.id);
}

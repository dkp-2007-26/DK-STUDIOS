import { deleteFileFromGoogleDrive } from "../lib/google-drive-storage.js";
import { getSupabaseServiceClient } from "../lib/supabase-server.js";
import {
  captureFunctionError,
  flushGlitchTip,
  initGlitchTip,
  safeErrorMessage,
} from "../lib/glitchtip.js";

export const config = {
  schedule: "@hourly",
};

initGlitchTip({ surface: "google-drive-cleanup" });

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function completedAt(order) {
  return order.delivered_at || order.pickup_completed_at || order.completed_at || null;
}

function scheduledAt(order) {
  if (order.files_deletion_scheduled_at) return new Date(order.files_deletion_scheduled_at);
  const completed = completedAt(order);
  if (!completed) return null;
  return new Date(new Date(completed).getTime() + 60 * 60 * 1000);
}

async function markOrder(supabase, orderId, patch) {
  const { error } = await supabase
    .from("orders")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw error;
}

async function cleanupOrder(supabase, order, now) {
  const dueAt = scheduledAt(order);
  if (!dueAt || dueAt > now) return { orderId: order.id, skipped: "not_due" };

  const { data: photos, error } = await supabase
    .from("order_photos")
    .select("id,google_drive_file_id")
    .eq("order_id", order.id);
  if (error) throw error;

  const driveIds = (photos || [])
    .map((photo) => photo.google_drive_file_id)
    .filter(Boolean);

  if (driveIds.length === 0) {
    await markOrder(supabase, order.id, {
      file_retention_status: "skipped",
      files_deleted_at: now.toISOString(),
      files_deletion_error: null,
    });
    return { orderId: order.id, deleted: 0, skipped: "no_drive_files" };
  }

  try {
    await markOrder(supabase, order.id, {
      file_retention_status: "scheduled",
      files_deletion_scheduled_at: dueAt.toISOString(),
      files_deletion_failed_at: null,
      files_deletion_error: null,
    });

    for (const fileId of driveIds) {
      await deleteFileFromGoogleDrive(fileId);
    }

    await markOrder(supabase, order.id, {
      file_retention_status: "deleted",
      files_deleted_at: now.toISOString(),
      files_deletion_failed_at: null,
      files_deletion_error: null,
    });

    return { orderId: order.id, deleted: driveIds.length };
  } catch (error) {
    await markOrder(supabase, order.id, {
      file_retention_status: "failed",
      files_deletion_failed_at: now.toISOString(),
      files_deletion_error: safeErrorMessage(error, "Google Drive cleanup failed"),
    });
    throw error;
  }
}

export default async () => {
  const supabase = getSupabaseServiceClient();
  const now = new Date();
  const context = { now: now.toISOString(), checked: 0, cleaned: 0 };

  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("id,status,photo_count,file_retention_status,files_deletion_scheduled_at,delivered_at,pickup_completed_at,completed_at")
      .in("file_retention_status", ["retained", "scheduled", "failed"])
      .gt("photo_count", 0)
      .limit(50);
    if (error) throw error;

    const results = [];
    for (const order of orders || []) {
      context.checked += 1;
      if (!completedAt(order)) {
        results.push({ orderId: order.id, skipped: "not_completed" });
        continue;
      }
      const result = await cleanupOrder(supabase, order, now);
      if (result.deleted) context.cleaned += 1;
      results.push(result);
    }

    return json({ ok: true, ...context, results });
  } catch (error) {
    captureFunctionError(error, {
      functionName: "google-drive-cleanup",
      tags: { storage_provider: "google-drive" },
      extra: context,
      fingerprint: ["netlify", "google-drive-cleanup"],
    });
    await flushGlitchTip();
    return json({ error: safeErrorMessage(error, "Google Drive cleanup failed") }, 500);
  }
};

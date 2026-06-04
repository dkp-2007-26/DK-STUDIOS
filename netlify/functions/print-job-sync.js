import { downloadFileFromGoogleDrive } from "../lib/google-drive-storage.js";
import { getSupabaseServiceClient, requireRole } from "../lib/supabase-server.js";
import {
  captureFunctionError,
  flushGlitchTip,
  initGlitchTip,
  safeErrorMessage,
  shouldReportError,
} from "../lib/glitchtip.js";

initGlitchTip({ surface: "print-job-sync" });

class HttpError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getContentDisposition(fileName) {
  const safeName = String(fileName || "print-job.bin").replace(/[\\/:*?"<>|\r\n]/g, "_");
  return `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`;
}

async function getBody(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new HttpError("JSON body is required.", 400);
  }
  return await request.json();
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

export default async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const requestContext = {
    method: request.method,
    contentLength: request.headers.get("content-length"),
  };

  try {
    const body = await getBody(request);
    const sessionToken = String(body.sessionToken || body.accessToken || "");
    const action = String(body.action || "");
    await requireRole(sessionToken, ["admin"]);
    const supabase = getSupabaseServiceClient();

    Object.assign(requestContext, {
      action,
      printJobId: body.printJobId || null,
      desktopDeviceId: body.desktopDeviceId || null,
    });

    if (action === "list") {
      const { data, error } = await supabase
        .from("print_jobs")
        .select("*")
        .eq("status", "queued")
        .order("created_at")
        .limit(50);
      if (error) throw new HttpError(error.message);
      return json({ jobs: data.map(toPrintJob) });
    }

    if (action === "claim") {
      const { data, error } = await supabase
        .from("print_jobs")
        .update({
          status: "claimed",
          desktop_device_id: String(body.desktopDeviceId || "dk-studios-print"),
          desktop_device_name: String(body.desktopDeviceName || "DK STUDIOS Print"),
          desktop_claimed_at: new Date().toISOString(),
        })
        .eq("id", String(body.printJobId || ""))
        .select("*")
        .single();
      if (error) throw new HttpError(error.message);
      return json({ job: toPrintJob(data) });
    }

    if (action === "status") {
      const status = body.status;
      const now = new Date().toISOString();
      const patch = {
        status,
        desktop_device_id: String(body.desktopDeviceId || "dk-studios-print"),
        desktop_device_name: String(body.desktopDeviceName || "DK STUDIOS Print"),
        error_message: body.errorMessage ? String(body.errorMessage) : null,
        print_started_at: status === "printing" ? now : undefined,
        printed_at: status === "printed" ? now : undefined,
        failed_at: status === "failed" ? now : undefined,
      };
      Object.keys(patch).forEach((key) => patch[key] === undefined && delete patch[key]);
      const { data, error } = await supabase
        .from("print_jobs")
        .update(patch)
        .eq("id", String(body.printJobId || ""))
        .select("*")
        .single();
      if (error) throw new HttpError(error.message);
      return json({ job: toPrintJob(data) });
    }

    if (action === "download") {
      const { data: job, error } = await supabase
        .from("print_jobs")
        .select("*")
        .eq("id", String(body.printJobId || ""))
        .single();
      if (error || !job) throw new HttpError("Print job not found.", 404);
      const download = await downloadFileFromGoogleDrive(job.google_drive_file_id);
      return new Response(download.bytes, {
        status: 200,
        headers: {
          "Content-Type": download.mimeType || job.mime_type || "application/octet-stream",
          "Content-Length": String(download.bytes.length),
          "Content-Disposition": getContentDisposition(download.fileName || job.file_name),
          "Cache-Control": "private, no-store",
          "X-Print-Job-Id": String(job.id),
        },
      });
    }

    throw new HttpError("Unknown print sync action.", 400);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    captureFunctionError(error, {
      functionName: "print-job-sync",
      status,
      tags: {
        storage_provider: "google-drive",
      },
      extra: requestContext,
      fingerprint: ["netlify", "print-job-sync"],
    });

    if (shouldReportError(status)) {
      await flushGlitchTip();
    }

    return json({ error: safeErrorMessage(error, "Print sync failed") }, status);
  }
};

import { downloadFileFromGoogleDrive } from "../lib/google-drive-storage.js";
import { getSupabaseServiceClient, requireRole } from "../lib/supabase-server.js";
import {
  captureFunctionError,
  flushGlitchTip,
  initGlitchTip,
  safeErrorMessage,
  shouldReportError,
} from "../lib/glitchtip.js";

initGlitchTip({ surface: "google-drive-download" });

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
  const safeName = String(fileName || "download.bin").replace(/[\\/:*?"<>|\r\n]/g, "_");
  return `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`;
}

async function parseRequest(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await request.json();
  }
  const formData = await request.formData();
  return {
    sessionToken: String(formData.get("sessionToken") || ""),
    orderId: String(formData.get("orderId") || ""),
    fileId: String(formData.get("fileId") || ""),
  };
}

async function requireAdminPhotoAccess({ sessionToken, orderId, fileId }) {
  if (!sessionToken || !orderId || !fileId) {
    throw new HttpError("sessionToken, orderId, and fileId are required.", 400);
  }

  await requireRole(sessionToken, ["admin"]);
  const supabase = getSupabaseServiceClient();
  const { data: photo, error } = await supabase
    .from("order_photos")
    .select("*")
    .eq("order_id", orderId)
    .eq("google_drive_file_id", fileId)
    .maybeSingle();
  if (error) {
    throw new HttpError(error.message, 500);
  }
  if (!photo) {
    throw new HttpError("File is not attached to this order.", 404);
  }
}

export default async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let requestContext = {
    method: request.method,
    contentLength: request.headers.get("content-length"),
    hasContentType: Boolean(request.headers.get("content-type")),
  };

  try {
    const body = await parseRequest(request);
    requestContext = {
      ...requestContext,
      hasSessionToken: Boolean(body.sessionToken),
      orderId: body.orderId,
      hasFileId: Boolean(body.fileId),
      fileIdSuffix: body.fileId ? body.fileId.slice(-8) : "",
    };
    await requireAdminPhotoAccess(body);
    const download = await downloadFileFromGoogleDrive(body.fileId);

    return new Response(download.bytes, {
      status: 200,
      headers: {
        "Content-Type": download.mimeType,
        "Content-Length": String(download.bytes.length),
        "Content-Disposition": getContentDisposition(download.fileName),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    captureFunctionError(error, {
      functionName: "google-drive-download",
      status,
      tags: {
        storage_provider: "google-drive",
      },
      extra: requestContext,
      fingerprint: ["netlify", "google-drive-download"],
    });

    if (shouldReportError(status)) {
      await flushGlitchTip();
    }

    return json(
      {
        error: safeErrorMessage(error, "Download failed"),
      },
      status,
    );
  }
};

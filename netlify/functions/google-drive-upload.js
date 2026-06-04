import { uploadBufferToGoogleDrive } from "../lib/google-drive-storage.js";
import { getAuthContext } from "../lib/supabase-server.js";
import {
  captureFunctionError,
  flushGlitchTip,
  initGlitchTip,
  safeErrorMessage,
  shouldReportError,
} from "../lib/glitchtip.js";

const DEFAULT_MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

initGlitchTip({ surface: "google-drive-upload" });

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

function getMaxUploadBytes() {
  const configured = Number(process.env.GOOGLE_DRIVE_UPLOAD_MAX_BYTES);
  if (!Number.isFinite(configured) || configured <= 0) {
    return DEFAULT_MAX_UPLOAD_BYTES;
  }
  return configured;
}

async function requireUploadUser(sessionToken) {
  if (!sessionToken) {
    throw new HttpError("Sign in before uploading files.", 401);
  }

  const { authUser, appUser } = await getAuthContext(sessionToken);
  if (!authUser) {
    throw new HttpError("Your session has expired. Please sign in again.", 401);
  }
  return {
    id: appUser?.id ?? authUser.id,
    email: appUser?.email ?? authUser.email ?? "",
  };
}

function assertFolderBelongsToUser(folder, user) {
  const normalizedFolder = String(folder || "").replace(/^\/+/, "");
  const expectedPrefix = `d-k-studios/orders/${user.id}-`;
  if (!normalizedFolder.startsWith(expectedPrefix)) {
    throw new HttpError("Upload folder does not match the signed-in user.", 403);
  }
}

function assertGuestOrderFolder(folder) {
  const normalizedFolder = String(folder || "").replace(/^\/+/, "");
  if (!normalizedFolder.startsWith("d-k-studios/orders/guest-")) {
    throw new HttpError("Guest uploads must use a guest order folder.", 403);
  }
}

export default async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const requestContext = {
    method: request.method,
    contentLength: request.headers.get("content-length"),
    hasContentType: Boolean(request.headers.get("content-type")),
  };

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") || "d-k-studios/orders");
    const sessionToken = String(formData.get("sessionToken") || "");
    const user = sessionToken ? await requireUploadUser(sessionToken) : null;

    if (!(file instanceof File)) {
      return json({ error: "No file received" }, 400);
    }

    Object.assign(requestContext, {
      fileSize: file.size,
      mimeType: file.type || null,
      userId: user?.id ?? null,
      guestUpload: !user,
    });

    if (file.size > getMaxUploadBytes()) {
      return json({ error: "File is larger than the configured Google Drive upload limit." }, 413);
    }

    if (user) {
      assertFolderBelongsToUser(folder, user);
    } else {
      assertGuestOrderFolder(folder);
    }

    const upload = await uploadBufferToGoogleDrive({
      bytes: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      mimeType: file.type || null,
      folder,
      sourceUserId: user?.id ?? "guest",
      sourceUserEmail: user?.email ?? "guest@dk-studios.local",
    });

    return json(upload);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    captureFunctionError(error, {
      functionName: "google-drive-upload",
      status,
      tags: {
        storage_provider: "google-drive",
      },
      extra: requestContext,
      fingerprint: ["netlify", "google-drive-upload"],
    });

    if (shouldReportError(status)) {
      await flushGlitchTip();
    }

    return json(
      {
        error: safeErrorMessage(error, "Upload failed"),
      },
      status,
    );
  }
};

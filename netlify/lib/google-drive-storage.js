import crypto from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const DRIVE_FILE_FIELDS =
  "id,name,size,mimeType,webViewLink,webContentLink,thumbnailLink,parents";

class GoogleDriveStorageError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = "GoogleDriveStorageError";
    this.details = details;
  }
}

function readEnv(name) {
  return process.env[name] ?? "";
}

function requireEnv(name) {
  const value = readEnv(name);
  if (!value) {
    throw new GoogleDriveStorageError(`${name} is not configured`);
  }
  return value;
}

async function parseJsonResponse(response, label) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new GoogleDriveStorageError(`${label} returned invalid JSON`, {
      status: response.status,
      body: text.slice(0, 500),
    });
  }
}

async function getAccessToken() {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      refresh_token: requireEnv("GOOGLE_REFRESH_TOKEN"),
      grant_type: "refresh_token",
    }),
  });
  const payload = await parseJsonResponse(response, "Google OAuth refresh");
  if (!response.ok || !payload.access_token) {
    throw new GoogleDriveStorageError("Google OAuth refresh failed", payload);
  }
  return payload.access_token;
}

function normalizeFileName(fileName) {
  return String(fileName || "upload.bin")
    .replace(/[\\/]/g, "-")
    .replace(/[^a-zA-Z0-9._ -]/g, "-")
    .trim()
    .slice(0, 160) || "upload.bin";
}

function normalizeStoragePrefix(prefix) {
  return String(prefix || "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9._/-]/g, "-")
    .replace(/\/+/g, "/")
    .slice(0, 180);
}

function buildDriveFileName({ fileName, folder }) {
  const safeFileName = normalizeFileName(fileName);
  const safeFolder = normalizeStoragePrefix(folder);
  return safeFolder ? `${safeFolder}/${safeFileName}` : safeFileName;
}

function buildMultipartBody({ metadata, bytes, mimeType, boundary }) {
  return Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
        metadata,
      )}\r\n--${boundary}\r\nContent-Type: ${mimeType || "application/octet-stream"}\r\n\r\n`,
    ),
    bytes,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
}

export async function uploadBufferToGoogleDrive({
  bytes,
  fileName,
  mimeType,
  folder,
  sourceUserId,
  sourceUserEmail,
}) {
  const folderId = requireEnv("GOOGLE_DRIVE_FOLDER_ID");
  const accessToken = await getAccessToken();
  const driveFileName = buildDriveFileName({ fileName, folder });
  const boundary = `d-k-studios-${crypto.randomUUID()}`;
  const metadata = {
    name: driveFileName,
    mimeType: mimeType || "application/octet-stream",
    parents: [folderId],
    appProperties: {
      source: "d-k-studios",
      sourceFolder: normalizeStoragePrefix(folder),
      sourceUserId: sourceUserId ?? "",
      sourceUserEmail: sourceUserEmail ?? "",
    },
  };
  const body = buildMultipartBody({
    metadata,
    bytes,
    mimeType,
    boundary,
  });
  const params = new URLSearchParams({
    uploadType: "multipart",
    fields: DRIVE_FILE_FIELDS,
  });
  const response = await fetch(`${DRIVE_UPLOAD_URL}?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": String(body.length),
    },
    body,
  });
  const payload = await parseJsonResponse(response, "Google Drive upload");
  if (!response.ok || !payload.id) {
    throw new GoogleDriveStorageError("Google Drive upload failed", payload);
  }

  return {
    success: true,
    storageProvider: "google_drive",
    fileName: normalizeFileName(fileName),
    fileSize: bytes.length,
    mimeType: mimeType || null,
    googleDriveFileId: payload.id,
    googleDriveFolderId: folderId,
    googleDriveWebViewLink: payload.webViewLink ?? null,
    googleDriveWebContentLink: payload.webContentLink ?? null,
    googleDriveThumbnailLink: payload.thumbnailLink ?? null,
    previewUrl: payload.thumbnailLink ?? null,
    uploadResult: {
      id: payload.id,
      name: payload.name,
      parents: payload.parents ?? [],
    },
  };
}

export async function downloadFileFromGoogleDrive(fileId) {
  const accessToken = await getAccessToken();
  const metadataParams = new URLSearchParams({
    fields: "id,name,mimeType,size",
  });
  const metadataResponse = await fetch(
    `${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}?${metadataParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  const metadata = await parseJsonResponse(metadataResponse, "Google Drive file metadata");
  if (!metadataResponse.ok || !metadata.id) {
    throw new GoogleDriveStorageError("Google Drive file metadata lookup failed", metadata);
  }

  const contentResponse = await fetch(
    `${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!contentResponse.ok) {
    const details = await contentResponse.text().catch(() => "");
    throw new GoogleDriveStorageError("Google Drive file download failed", {
      status: contentResponse.status,
      body: details.slice(0, 500),
    });
  }

  return {
    fileName: metadata.name || `${fileId}.bin`,
    mimeType: metadata.mimeType || "application/octet-stream",
    bytes: Buffer.from(await contentResponse.arrayBuffer()),
  };
}

export async function deleteFileFromGoogleDrive(fileId) {
  if (!fileId) return { deleted: false, skipped: true };
  const accessToken = await getAccessToken();
  const response = await fetch(`${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    return { deleted: true, alreadyMissing: true };
  }

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new GoogleDriveStorageError("Google Drive file deletion failed", {
      status: response.status,
      body: details.slice(0, 500),
    });
  }

  return { deleted: true };
}

export { GoogleDriveStorageError };

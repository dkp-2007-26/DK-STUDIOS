export interface GoogleDriveUploadResponse {
  storageProvider: "google_drive";
  fileName: string;
  fileSize: number;
  mimeType: string | null;
  googleDriveFileId: string;
  googleDriveFolderId: string | null;
  googleDriveWebViewLink: string | null;
  googleDriveWebContentLink: string | null;
  googleDriveThumbnailLink: string | null;
  previewUrl: string | null;
}

export async function uploadFileToGoogleDrive({
  file,
  folder,
  sessionToken,
}: {
  file: File;
  folder: string;
  sessionToken?: string | null;
}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  if (sessionToken) {
    formData.append("sessionToken", sessionToken);
  }

  const response = await fetch("/.netlify/functions/google-drive-upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Google Drive upload failed.");
  }

  return (await response.json()) as GoogleDriveUploadResponse;
}

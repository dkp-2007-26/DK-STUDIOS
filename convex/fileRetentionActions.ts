"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";

type CleanupTarget = {
  orderId: Id<"orders">;
  status: Doc<"orders">["status"];
  deliveredAt: string | null;
  pickupCompletedAt: string | null;
  filesDeletedAt: string | null;
  photos: Array<{
    id: Id<"orderPhotos">;
    storageProvider: "google_drive" | null;
    googleDriveFileId: string | null;
  }>;
};

class GoogleDriveDeleteError extends Error {
  details: unknown;

  constructor(message: string, details: unknown = null) {
    super(message);
    this.name = "GoogleDriveDeleteError";
    this.details = details;
  }
}

function readEnv(name: string) {
  return process.env[name] ?? "";
}

function requireEnv(name: string) {
  const value = readEnv(name);
  if (!value) {
    throw new GoogleDriveDeleteError(`${name} is not configured`);
  }
  return value;
}

async function parseJsonResponse(response: Response, label: string) {
  const text = await response.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new GoogleDriveDeleteError(`${label} returned invalid JSON`, {
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
  if (!response.ok || typeof payload.access_token !== "string") {
    throw new GoogleDriveDeleteError("Google OAuth refresh failed", payload);
  }
  return payload.access_token;
}

function uniqueFileIds(fileIds: Array<string | null>) {
  return [...new Set(fileIds.map((item) => item?.trim() ?? "").filter(Boolean))];
}

async function deleteGoogleDriveFiles(fileIds: Array<string | null>) {
  const driveFileIds = uniqueFileIds(fileIds);
  if (driveFileIds.length === 0) {
    return { deletedFileIds: [] };
  }

  const accessToken = await getAccessToken();
  const deletedFileIds: string[] = [];
  for (const fileId of driveFileIds) {
    const response = await fetch(`${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 204 || response.status === 404) {
      deletedFileIds.push(fileId);
      continue;
    }

    const text = await response.text().catch(() => "");
    throw new GoogleDriveDeleteError("Google Drive delete failed", {
      fileId,
      status: response.status,
      body: text.slice(0, 500),
    });
  }

  return { deletedFileIds };
}

export const deleteDeliveredOrderFiles = internalAction({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const target: CleanupTarget | null = await ctx.runQuery(
      internal.fileRetention.getDeliveredOrderFileTarget,
      { orderId: args.orderId },
    );

    if (!target || target.filesDeletedAt) {
      return null;
    }

    if (!target.deliveredAt && !target.pickupCompletedAt && target.status !== "completed") {
      await ctx.runMutation(internal.fileRetention.markOrderFileCleanupFailed, {
        orderId: args.orderId,
        failedAt: new Date().toISOString(),
        errorMessage: "Order is no longer delivered or completed.",
      });
      return null;
    }

    try {
      const deletion = await deleteGoogleDriveFiles(
        target.photos.map((photo) => photo.googleDriveFileId),
      );
      await ctx.runMutation(internal.fileRetention.markOrderFilesDeleted, {
        orderId: args.orderId,
        deletedAt: new Date().toISOString(),
        deletedPaths: deletion.deletedFileIds,
      });
    } catch (error) {
      await ctx.runMutation(internal.fileRetention.markOrderFileCleanupFailed, {
        orderId: args.orderId,
        failedAt: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : "Delivered file cleanup failed.",
      });
    }

    return null;
  },
});

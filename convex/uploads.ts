import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireUser } from "./lib/auth";

export const listPhotosForOrder = query({
  args: {
    sessionToken: v.string(),
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    const normalizedId = ctx.db.normalizeId("orders", args.orderId);
    if (!normalizedId) {
      throw new Error("Invalid order id.");
    }

    const order = await ctx.db.get(normalizedId);
    if (!order || order.userId !== user._id) {
      throw new Error("Order not found.");
    }

    const photos = await ctx.db
      .query("orderPhotos")
      .withIndex("by_orderId_and_sortOrder", (q) => q.eq("orderId", normalizedId))
      .order("asc")
      .take(100);

    return photos.map((photo) => ({
      id: photo._id,
      file_name: photo.fileName,
      file_size: photo.fileSize,
      file_url:
        photo.googleDriveThumbnailLink ??
        photo.googleDriveWebViewLink ??
        photo.previewUrl ??
        "",
      storage_provider: photo.storageProvider ?? "google_drive",
      google_drive_file_id: photo.googleDriveFileId ?? null,
      google_drive_web_view_link: photo.googleDriveWebViewLink ?? null,
      google_drive_web_content_link: photo.googleDriveWebContentLink ?? null,
      sort_order: photo.sortOrder,
      created_at: photo.createdAt,
    }));
  },
});

export const listPhotosForOrderAdmin = query({
  args: {
    sessionToken: v.string(),
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const normalizedId = ctx.db.normalizeId("orders", args.orderId);
    if (!normalizedId) {
      throw new Error("Invalid order id.");
    }

    const photos = await ctx.db
      .query("orderPhotos")
      .withIndex("by_orderId_and_sortOrder", (q) => q.eq("orderId", normalizedId))
      .order("asc")
      .take(100);

    return photos.map((photo) => ({
      id: photo._id,
      file_name: photo.fileName,
      file_size: photo.fileSize,
      file_url:
        photo.googleDriveThumbnailLink ??
        photo.googleDriveWebViewLink ??
        photo.previewUrl ??
        "",
      storage_provider: photo.storageProvider ?? "google_drive",
      google_drive_file_id: photo.googleDriveFileId ?? null,
      google_drive_web_view_link: photo.googleDriveWebViewLink ?? null,
      google_drive_web_content_link: photo.googleDriveWebContentLink ?? null,
      sort_order: photo.sortOrder,
      created_at: photo.createdAt,
    }));
  },
});

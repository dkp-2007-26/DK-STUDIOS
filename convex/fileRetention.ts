import { internalMutation, internalQuery } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

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

export const getDeliveredOrderFileTarget = internalQuery({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args): Promise<CleanupTarget | null> => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      return null;
    }

    const photos = await ctx.db
      .query("orderPhotos")
      .withIndex("by_orderId_and_sortOrder", (q) => q.eq("orderId", args.orderId))
      .order("asc")
      .take(100);

    return {
      orderId: order._id,
      status: order.status,
      deliveredAt: order.deliveredAt ?? null,
      pickupCompletedAt: order.pickupCompletedAt ?? null,
      filesDeletedAt: order.filesDeletedAt ?? null,
      photos: photos.map((photo) => ({
        id: photo._id,
        storageProvider: photo.storageProvider ?? null,
        googleDriveFileId: photo.googleDriveFileId ?? null,
      })),
    };
  },
});

export const markOrderFilesDeleted = internalMutation({
  args: {
    orderId: v.id("orders"),
    deletedAt: v.string(),
    deletedPaths: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const photos = await ctx.db
      .query("orderPhotos")
      .withIndex("by_orderId_and_sortOrder", (q) => q.eq("orderId", args.orderId))
      .order("asc")
      .take(100);

    for (const photo of photos) {
      await ctx.db.delete(photo._id);
    }

    await ctx.db.patch(args.orderId, {
      fileRetentionStatus: args.deletedPaths.length > 0 ? "deleted" : "skipped",
      filesDeletedAt: args.deletedAt,
      filesDeletionFailedAt: null,
      filesDeletionError: null,
      updatedAt: args.deletedAt,
    });
  },
});

export const markOrderFileCleanupFailed = internalMutation({
  args: {
    orderId: v.id("orders"),
    failedAt: v.string(),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      fileRetentionStatus: "failed",
      filesDeletionFailedAt: args.failedAt,
      filesDeletionError: args.errorMessage.slice(0, 1000),
      updatedAt: args.failedAt,
    });
  },
});

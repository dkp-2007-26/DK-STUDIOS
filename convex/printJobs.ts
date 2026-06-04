import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { v } from "convex/values";

const nullableString = v.union(v.string(), v.null());
const optionalNullableString = v.optional(nullableString);

const printTargetValidator = v.union(v.literal("auto"), v.literal("color"), v.literal("bw"));
const printStatusValidator = v.union(
  v.literal("queued"),
  v.literal("claimed"),
  v.literal("printing"),
  v.literal("printed"),
  v.literal("failed"),
  v.literal("cancelled"),
);
const sourceTypeValidator = v.union(
  v.literal("final_artwork"),
  v.literal("original_upload"),
  v.literal("manual"),
);
const finalFileValidator = v.object({
  fileName: v.string(),
  fileSize: v.number(),
  mimeType: nullableString,
  googleDriveFileId: v.string(),
  googleDriveFolderId: optionalNullableString,
  googleDriveWebViewLink: optionalNullableString,
  googleDriveWebContentLink: optionalNullableString,
  googleDriveThumbnailLink: optionalNullableString,
  previewUrl: optionalNullableString,
});

type FinalFile = {
  fileName: string;
  fileSize: number;
  mimeType: string | null;
  googleDriveFileId: string;
  googleDriveFolderId?: string | null;
  googleDriveWebViewLink?: string | null;
  googleDriveWebContentLink?: string | null;
  googleDriveThumbnailLink?: string | null;
  previewUrl?: string | null;
};

function serializePrintJob(job: Doc<"printJobs">) {
  return {
    id: job._id,
    order_id: job.orderId,
    source_type: job.sourceType,
    title: job.title,
    file_name: job.fileName,
    file_size: job.fileSize,
    mime_type: job.mimeType,
    google_drive_file_id: job.googleDriveFileId,
    google_drive_folder_id: job.googleDriveFolderId ?? null,
    google_drive_web_view_link: job.googleDriveWebViewLink ?? null,
    google_drive_web_content_link: job.googleDriveWebContentLink ?? null,
    google_drive_thumbnail_link: job.googleDriveThumbnailLink ?? null,
    preview_url: job.previewUrl ?? null,
    target: job.target,
    copies: job.copies,
    notes: job.notes,
    status: job.status,
    requested_by_user_id: job.requestedByUserId,
    requested_by_email: job.requestedByEmail,
    desktop_device_id: job.desktopDeviceId ?? null,
    desktop_device_name: job.desktopDeviceName ?? null,
    desktop_claimed_at: job.desktopClaimedAt ?? null,
    print_started_at: job.printStartedAt ?? null,
    printed_at: job.printedAt ?? null,
    failed_at: job.failedAt ?? null,
    error_message: job.errorMessage ?? null,
    is_reprint: job.isReprint,
    parent_print_job_id: job.parentPrintJobId,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  };
}

async function getOrderById(ctx: QueryCtx | MutationCtx, orderId: string) {
  const normalizedId = ctx.db.normalizeId("orders", orderId);
  if (!normalizedId) {
    throw new Error("Invalid order id.");
  }
  const order = await ctx.db.get(normalizedId);
  if (!order) {
    throw new Error("Order not found.");
  }
  return order;
}

async function getPrintJobById(ctx: QueryCtx | MutationCtx, printJobId: string) {
  const normalizedId = ctx.db.normalizeId("printJobs", printJobId);
  if (!normalizedId) {
    throw new Error("Invalid print job id.");
  }
  const job = await ctx.db.get(normalizedId);
  if (!job) {
    throw new Error("Print job not found.");
  }
  return job;
}

async function isDirectPrintOrder(ctx: QueryCtx | MutationCtx, order: Doc<"orders">) {
  if (!order.serviceCode) {
    return false;
  }
  if (order.serviceCode === "printing") {
    return true;
  }
  const service = await ctx.db
    .query("services")
    .withIndex("by_code", (q) => q.eq("code", order.serviceCode ?? ""))
    .unique();
  return service?.category === "print";
}

async function getFirstOriginalUpload(ctx: MutationCtx, orderId: Id<"orders">): Promise<FinalFile> {
  const photo = await ctx.db
    .query("orderPhotos")
    .withIndex("by_orderId_and_sortOrder", (q) => q.eq("orderId", orderId))
    .order("asc")
    .first();

  if (!photo?.googleDriveFileId) {
    throw new Error("No printable customer upload is attached to this order.");
  }

  return {
    fileName: photo.fileName,
    fileSize: photo.fileSize,
    mimeType: photo.mimeType,
    googleDriveFileId: photo.googleDriveFileId,
    googleDriveFolderId: photo.googleDriveFolderId ?? null,
    googleDriveWebViewLink: photo.googleDriveWebViewLink ?? null,
    googleDriveWebContentLink: photo.googleDriveWebContentLink ?? null,
    googleDriveThumbnailLink: photo.googleDriveThumbnailLink ?? null,
    previewUrl: photo.previewUrl,
  };
}

async function insertPrintJob(
  ctx: MutationCtx,
  args: {
    orderId: Id<"orders"> | null;
    sourceType: "final_artwork" | "original_upload" | "manual";
    title: string;
    file: FinalFile;
    target: "auto" | "color" | "bw";
    copies: number;
    notes: string | null;
    requestedByUserId: Id<"users">;
    requestedByEmail: string;
    isReprint: boolean;
    parentPrintJobId: Id<"printJobs"> | null;
  },
) {
  const now = new Date().toISOString();
  const jobId = await ctx.db.insert("printJobs", {
    orderId: args.orderId,
    sourceType: args.sourceType,
    title: args.title,
    fileName: args.file.fileName,
    fileSize: args.file.fileSize,
    mimeType: args.file.mimeType,
    googleDriveFileId: args.file.googleDriveFileId,
    googleDriveFolderId: args.file.googleDriveFolderId ?? null,
    googleDriveWebViewLink: args.file.googleDriveWebViewLink ?? null,
    googleDriveWebContentLink: args.file.googleDriveWebContentLink ?? null,
    googleDriveThumbnailLink: args.file.googleDriveThumbnailLink ?? null,
    previewUrl: args.file.previewUrl ?? null,
    target: args.target,
    copies: Math.max(1, Math.min(50, Math.floor(args.copies || 1))),
    notes: args.notes,
    status: "queued",
    requestedByUserId: args.requestedByUserId,
    requestedByEmail: args.requestedByEmail,
    desktopDeviceId: null,
    desktopDeviceName: null,
    desktopClaimedAt: null,
    printStartedAt: null,
    printedAt: null,
    failedAt: null,
    errorMessage: null,
    isReprint: args.isReprint,
    parentPrintJobId: args.parentPrintJobId,
    createdAt: now,
    updatedAt: now,
  });

  const job = await ctx.db.get(jobId);
  if (!job) {
    throw new Error("Print job was not created.");
  }
  return serializePrintJob(job);
}

export const listForAdmin = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const jobs = await ctx.db
      .query("printJobs")
      .withIndex("by_createdAt", (q) => q)
      .order("desc")
      .take(300);

    return jobs.map(serializePrintJob);
  },
});

export const listQueuedForDesktop = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const jobs = await ctx.db
      .query("printJobs")
      .withIndex("by_status_and_createdAt", (q) => q.eq("status", "queued"))
      .order("asc")
      .take(25);

    return jobs.map(serializePrintJob);
  },
});

export const getDownloadContext = query({
  args: {
    sessionToken: v.string(),
    printJobId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const job = await getPrintJobById(ctx, args.printJobId);
    return {
      print_job_id: job._id,
      file_name: job.fileName,
      mime_type: job.mimeType,
      google_drive_file_id: job.googleDriveFileId,
      status: job.status,
    };
  },
});

export const createForOrder = mutation({
  args: {
    sessionToken: v.string(),
    orderId: v.string(),
    sourceType: sourceTypeValidator,
    finalFile: v.optional(finalFileValidator),
    target: printTargetValidator,
    copies: v.number(),
    notes: nullableString,
  },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx, args.sessionToken);
    const order = await getOrderById(ctx, args.orderId);
    let file: FinalFile;

    if (args.sourceType === "original_upload") {
      if (!(await isDirectPrintOrder(ctx, order))) {
        throw new Error("Upload the final edited file before printing this order.");
      }
      file = await getFirstOriginalUpload(ctx, order._id);
    } else {
      if (!args.finalFile?.googleDriveFileId) {
        throw new Error("Final edited file is required before this order can be printed.");
      }
      file = args.finalFile;
    }

    return await insertPrintJob(ctx, {
      orderId: order._id,
      sourceType: args.sourceType === "original_upload" ? "original_upload" : "final_artwork",
      title: `${order.billNumber ?? order._id} - ${order.customerName}`,
      file,
      target: args.target,
      copies: args.copies,
      notes: args.notes,
      requestedByUserId: user._id,
      requestedByEmail: user.email,
      isReprint: false,
      parentPrintJobId: null,
    });
  },
});

export const createStandalone = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    file: finalFileValidator,
    target: printTargetValidator,
    copies: v.number(),
    notes: nullableString,
  },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx, args.sessionToken);
    return await insertPrintJob(ctx, {
      orderId: null,
      sourceType: "manual",
      title: args.title.trim() || args.file.fileName,
      file: args.file,
      target: args.target,
      copies: args.copies,
      notes: args.notes,
      requestedByUserId: user._id,
      requestedByEmail: user.email,
      isReprint: false,
      parentPrintJobId: null,
    });
  },
});

export const reprint = mutation({
  args: {
    sessionToken: v.string(),
    printJobId: v.string(),
    notes: nullableString,
  },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx, args.sessionToken);
    const source = await getPrintJobById(ctx, args.printJobId);
    return await insertPrintJob(ctx, {
      orderId: source.orderId,
      sourceType: source.sourceType,
      title: `${source.title} - reprint`,
      file: {
        fileName: source.fileName,
        fileSize: source.fileSize,
        mimeType: source.mimeType,
        googleDriveFileId: source.googleDriveFileId,
        googleDriveFolderId: source.googleDriveFolderId ?? null,
        googleDriveWebViewLink: source.googleDriveWebViewLink ?? null,
        googleDriveWebContentLink: source.googleDriveWebContentLink ?? null,
        googleDriveThumbnailLink: source.googleDriveThumbnailLink ?? null,
        previewUrl: source.previewUrl ?? null,
      },
      target: source.target,
      copies: source.copies,
      notes: args.notes || source.notes,
      requestedByUserId: user._id,
      requestedByEmail: user.email,
      isReprint: true,
      parentPrintJobId: source._id,
    });
  },
});

export const cancel = mutation({
  args: {
    sessionToken: v.string(),
    printJobId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const job = await getPrintJobById(ctx, args.printJobId);
    if (job.status === "printing") {
      throw new Error("A job that is already printing cannot be cancelled.");
    }
    await ctx.db.patch(job._id, {
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    });
    const updated = await ctx.db.get(job._id);
    if (!updated) {
      throw new Error("Print job not found after cancel.");
    }
    return serializePrintJob(updated);
  },
});

export const claimForDesktop = mutation({
  args: {
    sessionToken: v.string(),
    printJobId: v.string(),
    desktopDeviceId: v.string(),
    desktopDeviceName: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const job = await getPrintJobById(ctx, args.printJobId);
    if (job.status !== "queued") {
      return serializePrintJob(job);
    }
    const now = new Date().toISOString();
    await ctx.db.patch(job._id, {
      status: "claimed",
      desktopDeviceId: args.desktopDeviceId,
      desktopDeviceName: args.desktopDeviceName,
      desktopClaimedAt: now,
      errorMessage: null,
      updatedAt: now,
    });
    const updated = await ctx.db.get(job._id);
    if (!updated) {
      throw new Error("Print job not found after claim.");
    }
    return serializePrintJob(updated);
  },
});

export const updateDesktopStatus = mutation({
  args: {
    sessionToken: v.string(),
    printJobId: v.string(),
    status: printStatusValidator,
    desktopDeviceId: v.string(),
    desktopDeviceName: v.string(),
    errorMessage: nullableString,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const job = await getPrintJobById(ctx, args.printJobId);
    const now = new Date().toISOString();
    await ctx.db.patch(job._id, {
      status: args.status,
      desktopDeviceId: args.desktopDeviceId,
      desktopDeviceName: args.desktopDeviceName,
      printStartedAt: args.status === "printing" ? job.printStartedAt ?? now : job.printStartedAt ?? null,
      printedAt: args.status === "printed" ? now : job.printedAt ?? null,
      failedAt: args.status === "failed" ? now : job.failedAt ?? null,
      errorMessage: args.status === "failed" ? args.errorMessage || "Print failed." : null,
      updatedAt: now,
    });
    const updated = await ctx.db.get(job._id);
    if (!updated) {
      throw new Error("Print job not found after status update.");
    }
    return serializePrintJob(updated);
  },
});

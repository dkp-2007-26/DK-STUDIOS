import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireStaff, requireUser } from "./lib/auth";
import { v } from "convex/values";

const nullableString = v.union(v.string(), v.null());
const nullableNumber = v.union(v.number(), v.null());
const photoAssetValidator = v.object({
  storageProvider: v.optional(v.literal("google_drive")),
  fileName: v.string(),
  fileSize: v.number(),
  mimeType: nullableString,
  googleDriveFileId: v.optional(nullableString),
  googleDriveFolderId: v.optional(nullableString),
  googleDriveWebViewLink: v.optional(nullableString),
  googleDriveWebContentLink: v.optional(nullableString),
  googleDriveThumbnailLink: v.optional(nullableString),
  previewUrl: nullableString,
  sortOrder: v.number(),
  cropX: v.optional(nullableNumber),
  cropY: v.optional(nullableNumber),
  cropWidth: v.optional(nullableNumber),
  cropHeight: v.optional(nullableNumber),
});
const orderStatusValidator = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled"),
);
const paymentStatusValidator = v.union(
  v.literal("pending"),
  v.literal("paid"),
  v.literal("refunded"),
  v.literal("failed"),
);
const barcodeBaseUrl = "https://quickchart.io/barcode";
const deliveredFileDeleteDelayMs = 60 * 60 * 1000;
const mandatoryAdvanceAmount = 49;

function getDeliveredFileDeleteDelayMs() {
  const configured = Number(process.env.GOOGLE_DELETE_AFTER_DELIVERY_MS);
  if (!Number.isFinite(configured) || configured <= 0) {
    return deliveredFileDeleteDelayMs;
  }
  return configured;
}

function buildBarcodeUrl(text: string) {
  const params = new URLSearchParams({
    type: "code128",
    text,
    format: "svg",
    includeText: "true",
    width: "360",
    height: "120",
  });
  return `${barcodeBaseUrl}?${params.toString()}`;
}

function createReviewToken() {
  return `rvw_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function toPaise(amount: number) {
  return Math.round(amount * 100);
}

function serializeOrder(order: Doc<"orders">) {
  return {
    id: order._id,
    user_id: order.userId,
    service_id: order.serviceCode,
    template_id: order.templateCode ?? null,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone,
    instructions: order.instructions,
    frame_option: order.frameOption ?? null,
    frame_size: order.frameSize ?? null,
    collage_preference: order.collagePreference ?? null,
    personalization_text: order.personalizationText ?? null,
    photo_count: order.photoCount ?? 0,
    photo_names: order.photoNames ?? [],
    google_drive_folder_id: order.googleDriveFolderId ?? null,
    delivery_type: order.deliveryType,
    status: order.status,
    payment_status: order.paymentStatus,
    payment_provider: order.paymentProvider ?? null,
    payment_order_id: order.paymentOrderId ?? null,
    payment_id: order.paymentId ?? null,
    payment_link_url: order.paymentLinkUrl ?? null,
    subtotal_amount: order.subtotalAmount ?? order.totalAmount,
    discount_code: order.discountCode ?? null,
    discount_percentage: order.discountPercentage ?? null,
    discount_amount: order.discountAmount ?? null,
    total_amount: order.totalAmount,
    advance_amount: order.advanceAmount,
    advance_amount_paise: toPaise(order.advanceAmount),
    admin_notes: order.adminNotes,
    barcode_value: order.barcodeValue ?? null,
    barcode_url: order.barcodeUrl ?? null,
    tracking_url: order.trackingUrl ?? null,
    bill_number: order.billNumber ?? null,
    review_token: order.reviewToken ?? null,
    payment_completed_at: order.paymentCompletedAt ?? null,
    completed_at: order.completedAt ?? null,
    delivered_at: order.deliveredAt ?? null,
    pickup_ready_at: order.pickupReadyAt ?? null,
    pickup_ready_by: order.pickupReadyBy ?? null,
    pickup_ready_notified_at: order.pickupReadyNotifiedAt ?? null,
    pickup_completed_at: order.pickupCompletedAt ?? null,
    last_barcode_scanned_at: order.lastBarcodeScannedAt ?? null,
    barcode_scan_count: order.barcodeScanCount ?? 0,
    customer_notified_at: order.customerNotifiedAt ?? null,
    review_request_sent_at: order.reviewRequestSentAt ?? null,
    review_submitted_at: order.reviewSubmittedAt ?? null,
    delivery_verified_by: order.deliveryVerifiedBy ?? null,
    file_retention_status: order.fileRetentionStatus ?? "retained",
    files_deletion_scheduled_at: order.filesDeletionScheduledAt ?? null,
    files_deleted_at: order.filesDeletedAt ?? null,
    files_deletion_failed_at: order.filesDeletionFailedAt ?? null,
    files_deletion_error: order.filesDeletionError ?? null,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

async function getOrderById(ctx: MutationCtx | QueryCtx, orderId: string) {
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

async function getPromotionForCode(ctx: MutationCtx, promoCode: string | null | undefined) {
  if (!promoCode) {
    return null;
  }

  const promotion = await ctx.db
    .query("promotions")
    .withIndex("by_code", (q) => q.eq("code", promoCode.toUpperCase()))
    .unique();

  if (!promotion || !promotion.isActive) {
    throw new Error("Promo code is not active.");
  }

  if (promotion.validUntil && new Date(promotion.validUntil).getTime() < Date.now()) {
    throw new Error("Promo code has expired.");
  }

  if (
    promotion.maxUses !== null &&
    promotion.maxUses !== undefined &&
    promotion.usesCount >= promotion.maxUses
  ) {
    throw new Error("Promo code has reached its usage limit.");
  }

  return promotion;
}

async function createGuestCustomer(ctx: MutationCtx, name: string) {
  const now = new Date().toISOString();
  return await ctx.db.insert("users", {
    email: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}@dk-studios.local`,
    displayName: name.trim() || "Guest Customer",
    passwordHash: "guest-checkout",
    isAdmin: false,
    role: "customer",
    createdAt: now,
    updatedAt: now,
  });
}

async function queueOrderNotification(
  ctx: MutationCtx,
  orderId: Id<"orders">,
  event: string,
) {
  await ctx.scheduler.runAfter(0, internal.notificationActions.sendOrderLifecycleNotifications, {
    orderId,
    event,
  });
}

async function scheduleDeliveredFileDeletion(
  ctx: MutationCtx,
  order: Doc<"orders">,
  now: string,
) {
  if (
    order.filesDeletedAt ||
    order.filesDeletionScheduledAt ||
    order.fileRetentionStatus === "deleted" ||
    order.fileRetentionStatus === "skipped"
  ) {
    return;
  }

  const delayMs = getDeliveredFileDeleteDelayMs();
  const scheduledAt = new Date(Date.now() + delayMs).toISOString();
  await ctx.db.patch(order._id, {
    fileRetentionStatus: "scheduled",
    filesDeletionScheduledAt: scheduledAt,
    filesDeletionFailedAt: null,
    filesDeletionError: null,
    updatedAt: now,
  });
  await ctx.scheduler.runAfter(delayMs, internal.fileRetentionActions.deleteDeliveredOrderFiles, {
    orderId: order._id,
  });
}

export const listMine = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);

    return orders.map(serializeOrder);
  },
});

export const listAllForAdmin = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt", (q) => q)
      .order("desc")
      .take(250);

    return orders.map(serializeOrder);
  },
});

export const listHistoryForStaff = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt", (q) => q)
      .order("desc")
      .take(500);

    return orders.map(serializeOrder);
  },
});

export const previewPromotion = query({
  args: {
    promoCode: v.string(),
    subtotalAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const promotion = await ctx.db
      .query("promotions")
      .withIndex("by_code", (q) => q.eq("code", args.promoCode.toUpperCase()))
      .unique();

    if (!promotion || !promotion.isActive) {
      return null;
    }

    if (promotion.validUntil && new Date(promotion.validUntil).getTime() < Date.now()) {
      return null;
    }

    if (
      promotion.maxUses !== null &&
      promotion.maxUses !== undefined &&
      promotion.usesCount >= promotion.maxUses
    ) {
      return null;
    }

    const discountAmount = Number(
      ((args.subtotalAmount * promotion.discountPercentage) / 100).toFixed(2),
    );
    return {
      code: promotion.code,
      description: promotion.description,
      discount_percentage: promotion.discountPercentage,
      discount_amount: discountAmount,
      total_amount: Math.max(args.subtotalAmount - discountAmount, 0),
      valid_until: promotion.validUntil,
    };
  },
});

export const create = mutation({
  args: {
    sessionToken: v.optional(nullableString),
    serviceCode: nullableString,
    templateCode: v.optional(nullableString),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: nullableString,
    instructions: nullableString,
    frameOption: v.optional(nullableString),
    frameSize: v.optional(nullableString),
    collagePreference: v.optional(nullableString),
    personalizationText: v.optional(nullableString),
    photoCount: v.optional(v.number()),
    photoNames: v.optional(v.array(v.string())),
    photoAssets: v.optional(v.array(photoAssetValidator)),
    deliveryType: v.union(v.literal("digital"), v.literal("printed")),
    subtotalAmount: v.number(),
    promoCode: v.optional(nullableString),
    totalAmount: v.number(),
    advanceAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const session = args.sessionToken ? await requireUser(ctx, args.sessionToken) : null;
    const userId = session?.user._id ?? await createGuestCustomer(ctx, args.customerName);
    const now = new Date().toISOString();
    const barcodeValue = `DK-${Date.now()}`;
    const billNumber = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const reviewToken = createReviewToken();
    const promotion = await getPromotionForCode(ctx, args.promoCode ?? null);
    const discountPercentage = promotion?.discountPercentage ?? null;
    const discountAmount =
      promotion !== null
        ? Number(((args.subtotalAmount * promotion.discountPercentage) / 100).toFixed(2))
        : null;
    const computedTotal = Number(
      Math.max(args.subtotalAmount - (discountAmount ?? 0), 0).toFixed(2),
    );
    if (Math.abs(computedTotal - args.totalAmount) > 0.01) {
      throw new Error("Order total no longer matches the selected promotion.");
    }
    if (Math.abs(args.advanceAmount - mandatoryAdvanceAmount) > 0.01) {
      throw new Error(`Rs. ${mandatoryAdvanceAmount} online advance is required to submit this request.`);
    }

    const orderId = await ctx.db.insert("orders", {
      userId,
      serviceCode: args.serviceCode,
      templateCode: args.templateCode ?? null,
      customerName: args.customerName,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
      instructions: args.instructions,
      frameOption: args.frameOption ?? null,
      frameSize: args.frameSize ?? null,
      collagePreference: args.collagePreference ?? null,
      personalizationText: args.personalizationText ?? null,
      photoCount: args.photoCount ?? 0,
      photoNames: args.photoNames ?? [],
      googleDriveFolderId: args.photoAssets?.[0]?.googleDriveFolderId ?? null,
      deliveryType: args.deliveryType,
      status: "pending",
      paymentStatus: "pending",
      paymentProvider: "razorpay",
      paymentOrderId: null,
      paymentId: null,
      paymentLinkUrl: null,
      subtotalAmount: args.subtotalAmount,
      discountCode: promotion?.code ?? null,
      discountPercentage,
      discountAmount,
      totalAmount: computedTotal,
      advanceAmount: args.advanceAmount,
      adminNotes: null,
      barcodeValue,
      barcodeUrl: buildBarcodeUrl(barcodeValue),
      trackingUrl: `${buildBarcodeUrl(barcodeValue)}&label=${encodeURIComponent(billNumber)}`,
      billNumber,
      reviewToken,
      paymentCompletedAt: null,
      completedAt: null,
      deliveredAt: null,
      pickupReadyAt: null,
      pickupReadyBy: null,
      pickupReadyNotifiedAt: null,
      pickupCompletedAt: null,
      lastBarcodeScannedAt: null,
      barcodeScanCount: 0,
      customerNotifiedAt: null,
      reviewRequestSentAt: null,
      reviewSubmittedAt: null,
      deliveryVerifiedBy: null,
      fileRetentionStatus: (args.photoAssets?.length ?? 0) > 0 ? "retained" : "skipped",
      filesDeletionScheduledAt: null,
      filesDeletedAt: null,
      filesDeletionFailedAt: null,
      filesDeletionError: null,
      createdAt: now,
      updatedAt: now,
    });

    for (const photo of args.photoAssets ?? []) {
      await ctx.db.insert("orderPhotos", {
        orderId,
        userId,
        storageProvider: photo.storageProvider ?? "google_drive",
        fileName: photo.fileName,
        fileSize: photo.fileSize,
        mimeType: photo.mimeType,
        googleDriveFileId: photo.googleDriveFileId ?? null,
        googleDriveFolderId: photo.googleDriveFolderId ?? null,
        googleDriveWebViewLink: photo.googleDriveWebViewLink ?? null,
        googleDriveWebContentLink: photo.googleDriveWebContentLink ?? null,
        googleDriveThumbnailLink: photo.googleDriveThumbnailLink ?? null,
        previewUrl: photo.previewUrl,
        sortOrder: photo.sortOrder,
        cropX: photo.cropX ?? null,
        cropY: photo.cropY ?? null,
        cropWidth: photo.cropWidth ?? null,
        cropHeight: photo.cropHeight ?? null,
        createdAt: now,
      });
    }

    await ctx.db.insert("reviews", {
      orderId,
      userId,
      customerName: args.customerName,
      customerEmail: args.customerEmail,
      publicLocation: null,
      rating: 5,
      message: "",
      status: "pending",
      reviewToken,
      requestedAt: null,
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      adminNotes: null,
      createdAt: now,
      updatedAt: now,
    });

    if (promotion) {
      await ctx.db.patch(promotion._id, {
        usesCount: promotion.usesCount + 1,
        updatedAt: now,
      });
    }

    const created = await ctx.db.get(orderId);
    if (!created) {
      throw new Error("Failed to create order.");
    }

    return serializeOrder(created);
  },
});

export const getByIdPublic = query({
  args: {
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedId = ctx.db.normalizeId("orders", args.orderId.trim());
    if (!normalizedId) {
      return null;
    }
    const order = await ctx.db.get(normalizedId);
    return order ? serializeOrder(order) : null;
  },
});

export const getByBarcodeForAdmin = query({
  args: {
    sessionToken: v.string(),
    barcodeValue: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const order = await ctx.db
      .query("orders")
      .withIndex("by_barcodeValue", (q) => q.eq("barcodeValue", args.barcodeValue))
      .unique();

    return order ? serializeOrder(order) : null;
  },
});

export const getByBarcodeForDelivery = query({
  args: {
    sessionToken: v.string(),
    barcodeValue: v.string(),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    const order = await ctx.db
      .query("orders")
      .withIndex("by_barcodeValue", (q) => q.eq("barcodeValue", args.barcodeValue))
      .unique();

    return order ? serializeOrder(order) : null;
  },
});

export const getMineById = query({
  args: {
    sessionToken: v.string(),
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUser(ctx, args.sessionToken);
    const order = await getOrderById(ctx, args.orderId);
    if (order.userId !== user._id) {
      throw new Error("Order not found.");
    }
    return serializeOrder(order);
  },
});

export const markDeliveredByBarcode = mutation({
  args: {
    sessionToken: v.string(),
    barcodeValue: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireStaff(ctx, args.sessionToken);
    const order = await ctx.db
      .query("orders")
      .withIndex("by_barcodeValue", (q) => q.eq("barcodeValue", args.barcodeValue))
      .unique();

    if (!order) {
      throw new Error("No order found for this barcode.");
    }

    const now = new Date().toISOString();
    await ctx.db.patch(order._id, {
      status: "completed",
      deliveredAt: now,
      pickupCompletedAt: order.pickupCompletedAt ?? now,
      lastBarcodeScannedAt: now,
      barcodeScanCount: (order.barcodeScanCount ?? 0) + 1,
      completedAt: order.completedAt ?? now,
      deliveryVerifiedBy: user.email,
      customerNotifiedAt: now,
      updatedAt: now,
    });
    await scheduleDeliveredFileDeletion(ctx, order, now);

    await queueOrderNotification(ctx, order._id, "order_completed");
    await queueOrderNotification(ctx, order._id, "review_request");

    const updated = await ctx.db.get(order._id);
    if (!updated) {
      throw new Error("Order not found after delivery update.");
    }

    return serializeOrder(updated);
  },
});

export const processPickupScanByBarcode = mutation({
  args: {
    sessionToken: v.string(),
    barcodeValue: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireStaff(ctx, args.sessionToken);
    const barcodeValue = args.barcodeValue.trim().toUpperCase();
    const order = await ctx.db
      .query("orders")
      .withIndex("by_barcodeValue", (q) => q.eq("barcodeValue", barcodeValue))
      .unique();

    if (!order) {
      throw new Error("No order found for this barcode.");
    }

    const now = new Date().toISOString();
    const nextScanCount = (order.barcodeScanCount ?? 0) + 1;

    if (order.deliveredAt || order.pickupCompletedAt || order.status === "completed") {
      await ctx.db.patch(order._id, {
        lastBarcodeScannedAt: now,
        barcodeScanCount: nextScanCount,
        updatedAt: now,
      });
      const updated = await ctx.db.get(order._id);
      if (!updated) {
        throw new Error("Order not found after scan update.");
      }
      return {
        stage: "already_picked_up" as const,
        scannedAt: now,
        message: `${updated.customerName} was already picked up.`,
        order: serializeOrder(updated),
      };
    }

    if (!order.pickupReadyAt) {
      await ctx.db.patch(order._id, {
        status: order.status === "pending" ? "confirmed" : order.status,
        pickupReadyAt: now,
        pickupReadyBy: user.email,
        lastBarcodeScannedAt: now,
        barcodeScanCount: nextScanCount,
        updatedAt: now,
      });

      await queueOrderNotification(ctx, order._id, "pickup_ready");

      const updated = await ctx.db.get(order._id);
      if (!updated) {
        throw new Error("Order not found after pickup ready update.");
      }
      return {
        stage: "ready_for_pickup" as const,
        scannedAt: now,
        message: `${updated.customerName} marked ready for pickup.`,
        order: serializeOrder(updated),
      };
    }

    await ctx.db.patch(order._id, {
      status: "completed",
      deliveredAt: now,
      pickupCompletedAt: now,
      completedAt: order.completedAt ?? now,
      deliveryVerifiedBy: user.email,
      customerNotifiedAt: now,
      lastBarcodeScannedAt: now,
      barcodeScanCount: nextScanCount,
      updatedAt: now,
    });
    await scheduleDeliveredFileDeletion(ctx, order, now);

    await queueOrderNotification(ctx, order._id, "order_completed");
    await queueOrderNotification(ctx, order._id, "review_request");

    const updated = await ctx.db.get(order._id);
    if (!updated) {
      throw new Error("Order not found after pickup completion update.");
    }
    return {
      stage: "pickup_successful" as const,
      scannedAt: now,
      message: `${updated.customerName} pickup completed.`,
      order: serializeOrder(updated),
    };
  },
});

export const updateStatus = mutation({
  args: {
    sessionToken: v.string(),
    orderId: v.string(),
    status: orderStatusValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const order = await getOrderById(ctx, args.orderId);
    const now = new Date().toISOString();
    await ctx.db.patch(order._id, {
      status: args.status,
      completedAt: args.status === "completed" ? order.completedAt ?? now : order.completedAt ?? null,
      updatedAt: now,
    });

    if (args.status === "in_progress") {
      await queueOrderNotification(ctx, order._id, "order_in_progress");
    }

    if (args.status === "completed") {
      await scheduleDeliveredFileDeletion(ctx, order, now);
      await queueOrderNotification(ctx, order._id, "order_completed");
      await queueOrderNotification(ctx, order._id, "review_request");
    }

    const updated = await ctx.db.get(order._id);
    if (!updated) {
      throw new Error("Order not found after update.");
    }
    return serializeOrder(updated);
  },
});

export const updatePaymentStatus = mutation({
  args: {
    sessionToken: v.string(),
    orderId: v.string(),
    paymentStatus: paymentStatusValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const order = await getOrderById(ctx, args.orderId);
    const now = new Date().toISOString();
    await ctx.db.patch(order._id, {
      paymentStatus: args.paymentStatus,
      paymentCompletedAt:
        args.paymentStatus === "paid" ? order.paymentCompletedAt ?? now : order.paymentCompletedAt ?? null,
      updatedAt: now,
    });
    const updated = await ctx.db.get(order._id);
    if (!updated) {
      throw new Error("Order not found after update.");
    }
    return serializeOrder(updated);
  },
});

export const updateAdminNotes = mutation({
  args: {
    sessionToken: v.string(),
    orderId: v.string(),
    adminNotes: nullableString,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const order = await getOrderById(ctx, args.orderId);
    await ctx.db.patch(order._id, {
      adminNotes: args.adminNotes,
      updatedAt: new Date().toISOString(),
    });
    const updated = await ctx.db.get(order._id);
    if (!updated) {
      throw new Error("Order not found after update.");
    }
    return serializeOrder(updated);
  },
});

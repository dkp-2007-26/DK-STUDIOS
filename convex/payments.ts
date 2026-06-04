import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireAdmin, requireStaff } from "./lib/auth";

const nullableString = v.union(v.string(), v.null());
const deliveredFileDeleteDelayMs = 60 * 60 * 1000;

function getDeliveredFileDeleteDelayMs() {
  const configured = Number(process.env.GOOGLE_DELETE_AFTER_DELIVERY_MS);
  if (!Number.isFinite(configured) || configured <= 0) {
    return deliveredFileDeleteDelayMs;
  }
  return configured;
}

export const getCheckoutContext = query({
  args: {
    sessionToken: v.optional(nullableString),
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedId = ctx.db.normalizeId("orders", args.orderId);
    if (!normalizedId) {
      throw new Error("Invalid order id.");
    }

    const order = await ctx.db.get(normalizedId);
    if (!order) {
      throw new Error("Order not found.");
    }

    return {
      order_id: order._id,
      bill_number: order.billNumber ?? order._id,
      amount: order.advanceAmount,
      amount_paise: Math.round(order.advanceAmount * 100),
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      customer_phone: order.customerPhone,
      existing_provider_order_id: order.paymentOrderId ?? null,
      payment_status: order.paymentStatus,
    };
  },
});

export const recordCheckoutOrder = mutation({
  args: {
    sessionToken: v.optional(nullableString),
    orderId: v.string(),
    provider: v.optional(v.string()),
    providerOrderId: v.string(),
    amount: v.number(),
    currency: v.string(),
    checkoutUrl: v.optional(nullableString),
  },
  handler: async (ctx, args) => {
    const normalizedId = ctx.db.normalizeId("orders", args.orderId);
    if (!normalizedId) {
      throw new Error("Invalid order id.");
    }

    const order = await ctx.db.get(normalizedId);
    if (!order) {
      throw new Error("Order not found.");
    }

    const now = new Date().toISOString();
    const provider = args.provider ?? "razorpay";
    await ctx.db.patch(order._id, {
      paymentProvider: provider,
      paymentOrderId: args.providerOrderId,
      paymentLinkUrl: args.checkoutUrl ?? order.paymentLinkUrl ?? null,
      updatedAt: now,
    });

    const existing = await ctx.db
      .query("payments")
      .withIndex("by_providerOrderId", (q) => q.eq("providerOrderId", args.providerOrderId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        amount: args.amount,
        currency: args.currency,
        checkoutUrl: args.checkoutUrl ?? existing.checkoutUrl,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("payments", {
        orderId: order._id,
        userId: order.userId,
        provider,
        providerOrderId: args.providerOrderId,
        providerPaymentId: null,
        providerSignature: null,
        status: "created",
        amount: args.amount,
        currency: args.currency,
        receipt: order.billNumber ?? order._id,
        checkoutUrl: null,
        metadataSummary: `Advance payment for ${order.billNumber ?? order._id}`,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { ok: true };
  },
});

export const captureCheckoutSuccess = mutation({
  args: {
    sessionToken: v.optional(nullableString),
    orderId: v.string(),
    providerOrderId: v.string(),
    providerPaymentId: v.string(),
    providerSignature: nullableString,
  },
  handler: async (ctx, args) => {
    const normalizedId = ctx.db.normalizeId("orders", args.orderId);
    if (!normalizedId) {
      throw new Error("Invalid order id.");
    }

    const order = await ctx.db.get(normalizedId);
    if (!order) {
      throw new Error("Order not found.");
    }

    const payment = await ctx.db
      .query("payments")
      .withIndex("by_providerOrderId", (q) => q.eq("providerOrderId", args.providerOrderId))
      .unique();
    if (!payment) {
      return { ok: false };
    }

    await ctx.db.patch(payment._id, {
      providerPaymentId: args.providerPaymentId,
      providerSignature: args.providerSignature,
      updatedAt: new Date().toISOString(),
    });

    return { ok: true };
  },
});

export const listForAdmin = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const payments = await ctx.db.query("payments").take(200);
    return payments.map((payment) => ({
      id: payment._id,
      order_id: payment.orderId,
      provider: payment.provider,
      provider_order_id: payment.providerOrderId,
      provider_payment_id: payment.providerPaymentId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      created_at: payment.createdAt,
      updated_at: payment.updatedAt,
    })).sort((left, right) => right.created_at.localeCompare(left.created_at));
  },
});

export const getDeliveryBalanceContext = query({
  args: {
    sessionToken: v.string(),
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireStaff(ctx, args.sessionToken);
    const normalizedId = ctx.db.normalizeId("orders", args.orderId);
    if (!normalizedId) {
      throw new Error("Invalid order id.");
    }

    const order = await ctx.db.get(normalizedId);
    if (!order) {
      throw new Error("Order not found.");
    }

    const balanceAmount = Math.max(order.totalAmount - order.advanceAmount, 0);
    const latestPayments = await ctx.db
      .query("payments")
      .withIndex("by_orderId_and_createdAt", (q) => q.eq("orderId", order._id))
      .order("desc")
      .take(20);
    const existingQr = latestPayments.find(
      (payment) =>
        payment.provider === "razorpay_qr" &&
        payment.status === "created" &&
        payment.providerOrderId?.startsWith("qr_"),
    );

    return {
      order_id: order._id,
      bill_number: order.billNumber ?? order._id,
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      customer_phone: order.customerPhone,
      staff_email: user.email,
      advance_paid: order.paymentStatus === "paid",
      balance_amount: balanceAmount,
      balance_amount_paise: Math.round(balanceAmount * 100),
      existing_qr_id: existingQr?.providerOrderId ?? null,
      existing_qr_image_url: existingQr?.checkoutUrl ?? null,
    };
  },
});

export const recordDeliveryBalanceQr = mutation({
  args: {
    sessionToken: v.string(),
    orderId: v.string(),
    qrId: v.string(),
    imageUrl: nullableString,
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireStaff(ctx, args.sessionToken);
    const normalizedId = ctx.db.normalizeId("orders", args.orderId);
    if (!normalizedId) {
      throw new Error("Invalid order id.");
    }

    const order = await ctx.db.get(normalizedId);
    if (!order) {
      throw new Error("Order not found.");
    }

    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_providerOrderId", (q) => q.eq("providerOrderId", args.qrId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        amount: args.amount,
        currency: args.currency,
        checkoutUrl: args.imageUrl,
        status: "created",
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("payments", {
        orderId: order._id,
        userId: user._id,
        provider: "razorpay_qr",
        providerOrderId: args.qrId,
        providerPaymentId: null,
        providerSignature: null,
        status: "created",
        amount: args.amount,
        currency: args.currency,
        receipt: order.billNumber ?? order._id,
        checkoutUrl: args.imageUrl,
        metadataSummary: `Delivery balance payment for ${order.billNumber ?? order._id}`,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { ok: true };
  },
});

export const applyWebhookPayment = internalMutation({
  args: {
    providerOrderId: v.string(),
    providerPaymentId: v.string(),
    providerSignature: nullableString,
    amount: v.number(),
    status: v.union(v.literal("paid"), v.literal("failed"), v.literal("refunded")),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_providerOrderId", (q) => q.eq("providerOrderId", args.providerOrderId))
      .unique();
    if (!payment) {
      return { ok: false };
    }

    const order = await ctx.db.get(payment.orderId);
    if (!order) {
      return { ok: false };
    }

    if (payment.status === "paid" && args.status === "failed") {
      return { ok: true, orderId: order._id };
    }

    const now = new Date().toISOString();
    const paymentPatch: {
      providerPaymentId: string;
      amount: number;
      status: "paid" | "failed" | "refunded";
      updatedAt: string;
      providerSignature?: string | null;
    } = {
      providerPaymentId: args.providerPaymentId,
      amount: args.amount,
      status: args.status,
      updatedAt: now,
    };
    if (args.providerSignature !== null) {
      paymentPatch.providerSignature = args.providerSignature;
    }
    await ctx.db.patch(payment._id, paymentPatch);

    const wasAdvanceAlreadyPaid = order.paymentStatus === "paid";
    await ctx.db.patch(order._id, {
      status: args.status === "paid" && order.status === "pending" ? "confirmed" : order.status,
      paymentStatus:
        args.status === "paid"
          ? "paid"
          : args.status === "refunded"
          ? "refunded"
          : "failed",
      paymentId: args.providerPaymentId,
      paymentCompletedAt: args.status === "paid" ? now : order.paymentCompletedAt ?? null,
      updatedAt: now,
    });

    if (args.status === "paid" && !wasAdvanceAlreadyPaid) {
      await ctx.scheduler.runAfter(0, internal.notificationActions.sendOrderLifecycleNotifications, {
        orderId: order._id,
        event: "order_created",
      });
      await ctx.scheduler.runAfter(0, internal.notificationActions.sendOrderLifecycleNotifications, {
        orderId: order._id,
        event: "payment_received",
      });
    }

    return { ok: true, orderId: order._id };
  },
});

export const applyDeliveryBalancePayment = internalMutation({
  args: {
    providerOrderId: v.string(),
    providerPaymentId: nullableString,
    deliveryVerifiedBy: nullableString,
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_providerOrderId", (q) => q.eq("providerOrderId", args.providerOrderId))
      .unique();
    if (!payment) {
      return { ok: false };
    }

    const order = await ctx.db.get(payment.orderId);
    if (!order) {
      return { ok: false };
    }

    const now = new Date().toISOString();
    await ctx.db.patch(payment._id, {
      providerPaymentId: args.providerPaymentId,
      amount: args.amount,
      status: "paid",
      updatedAt: now,
    });

    const orderPatch = {
      status: "completed",
      deliveredAt: now,
      pickupCompletedAt: now,
      completedAt: order.completedAt ?? now,
      deliveryVerifiedBy: args.deliveryVerifiedBy ?? "Razorpay QR",
      customerNotifiedAt: now,
      updatedAt: now,
    } as const;
    await ctx.db.patch(order._id, orderPatch);

    if (
      !order.filesDeletedAt &&
      !order.filesDeletionScheduledAt &&
      order.fileRetentionStatus !== "deleted" &&
      order.fileRetentionStatus !== "skipped"
    ) {
      const delayMs = getDeliveredFileDeleteDelayMs();
      await ctx.db.patch(order._id, {
        fileRetentionStatus: "scheduled",
        filesDeletionScheduledAt: new Date(Date.now() + delayMs).toISOString(),
        filesDeletionFailedAt: null,
        filesDeletionError: null,
        updatedAt: now,
      });
      await ctx.scheduler.runAfter(delayMs, internal.fileRetentionActions.deleteDeliveredOrderFiles, {
        orderId: order._id,
      });
    }

    await ctx.scheduler.runAfter(0, internal.notificationActions.sendOrderLifecycleNotifications, {
      orderId: order._id,
      event: "order_completed",
    });
    await ctx.scheduler.runAfter(0, internal.notificationActions.sendOrderLifecycleNotifications, {
      orderId: order._id,
      event: "review_request",
    });

    return { ok: true, orderId: order._id };
  },
});

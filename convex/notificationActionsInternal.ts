import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getOrderForNotification = internalQuery({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      return null;
    }

    return {
      id: order._id,
      user_id: order.userId,
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      customer_phone: order.customerPhone,
      bill_number: order.billNumber ?? null,
      barcode_value: order.barcodeValue ?? null,
      barcode_url: order.barcodeUrl ?? null,
      tracking_url: order.trackingUrl ?? null,
      review_token: order.reviewToken ?? null,
    };
  },
});

export const markReviewRequested = internalMutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      return null;
    }

    const now = new Date().toISOString();
    await ctx.db.patch(order._id, {
      reviewRequestSentAt: now,
      customerNotifiedAt: now,
      updatedAt: now,
    });

    const review = await ctx.db
      .query("reviews")
      .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
      .unique();
    if (review) {
      await ctx.db.patch(review._id, {
        requestedAt: now,
        updatedAt: now,
      });
    }
    return null;
  },
});

export const markPickupReadyNotified = internalMutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      return null;
    }

    const now = new Date().toISOString();
    await ctx.db.patch(order._id, {
      pickupReadyNotifiedAt: now,
      customerNotifiedAt: now,
      updatedAt: now,
    });
    return null;
  },
});

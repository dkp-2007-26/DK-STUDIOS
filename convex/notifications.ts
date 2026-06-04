import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

const nullableString = v.union(v.string(), v.null());

export const listForAdmin = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const notifications = await ctx.db.query("notifications").take(200);
    return notifications.map((notification) => ({
      id: notification._id,
      order_id: notification.orderId,
      user_id: notification.userId,
      event: notification.event,
      channel: notification.channel,
      provider: notification.provider,
      recipient: notification.recipient,
      status: notification.status,
      external_id: notification.externalId,
      error_message: notification.errorMessage,
      created_at: notification.createdAt,
      updated_at: notification.updatedAt,
    })).sort((left, right) => right.created_at.localeCompare(left.created_at));
  },
});

export const createNotificationLog = internalMutation({
  args: {
    orderId: v.id("orders"),
    userId: v.id("users"),
    event: v.string(),
    channel: v.union(v.literal("email"), v.literal("sms"), v.literal("whatsapp")),
    provider: v.string(),
    recipient: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("skipped"),
      v.literal("failed"),
    ),
    externalId: nullableString,
    errorMessage: nullableString,
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("notifications", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

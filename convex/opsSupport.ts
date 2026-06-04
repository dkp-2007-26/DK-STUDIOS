import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db.query("supportMessages").order("desc").take(args.limit ?? 50);
  },
});

export const create = mutation({
  args: {
    subject: v.string(),
    message: v.string(),
    category: v.optional(v.string()),
    customerName: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    sourceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("supportMessages", {
      ...args,
      project: "DK STUDIOS",
      status: "open",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const reply = mutation({
  args: {
    messageId: v.id("supportMessages"),
    reply: v.string(),
    responder: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.messageId, {
      status: "replied",
      adminReply: args.reply,
      responder: args.responder ?? "Neurova Ops",
      repliedAt: now,
      updatedAt: now,
    });
    return { ok: true, repliedAt: now };
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

const nullableString = v.union(v.string(), v.null());

export const listForAdmin = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const promotions = await ctx.db
      .query("promotions")
      .withIndex("by_isActive_and_validUntil", (q) => q.eq("isActive", true))
      .order("desc")
      .take(100);
    const inactivePromotions = await ctx.db
      .query("promotions")
      .withIndex("by_isActive_and_validUntil", (q) => q.eq("isActive", false))
      .order("desc")
      .take(100);

    return [...promotions, ...inactivePromotions]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((promotion) => ({
        id: promotion._id,
        code: promotion.code,
        description: promotion.description,
        discount_percentage: promotion.discountPercentage,
        max_uses: promotion.maxUses,
        uses_count: promotion.usesCount,
        valid_until: promotion.validUntil,
        is_active: promotion.isActive,
        created_at: promotion.createdAt,
        updated_at: promotion.updatedAt,
      }));
  },
});

export const upsert = mutation({
  args: {
    sessionToken: v.string(),
    code: v.string(),
    description: nullableString,
    discountPercentage: v.number(),
    maxUses: v.union(v.number(), v.null()),
    validUntil: nullableString,
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const code = args.code.trim().toUpperCase();
    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("promotions")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        description: args.description,
        discountPercentage: args.discountPercentage,
        maxUses: args.maxUses,
        validUntil: args.validUntil,
        isActive: args.isActive,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("promotions", {
      code,
      description: args.description,
      discountPercentage: args.discountPercentage,
      maxUses: args.maxUses,
      usesCount: 0,
      validUntil: args.validUntil,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: {
    sessionToken: v.string(),
    promotionId: v.id("promotions"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    await ctx.db.delete(args.promotionId);
    return null;
  },
});

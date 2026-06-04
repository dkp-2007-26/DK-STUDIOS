import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

const nullableString = v.union(v.string(), v.null());

export const listServicesForAdmin = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const services = await ctx.db.query("services").take(300);
    return services
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((service) => ({
        id: service.code,
        name: service.name,
        description: service.description,
        base_price: service.basePrice,
        print_price: service.printPrice,
        category: service.category,
        is_active: service.isActive,
        sort_order: service.sortOrder,
        created_at: service.createdAt,
      }));
  },
});

export const upsertService = mutation({
  args: {
    sessionToken: v.string(),
    code: v.string(),
    name: v.string(),
    description: nullableString,
    basePrice: v.number(),
    printPrice: v.number(),
    category: v.string(),
    isActive: v.boolean(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const now = new Date().toISOString();
    const code = args.code.trim().toLowerCase();
    if (!code) {
      throw new Error("Service code is required.");
    }

    const existing = await ctx.db
      .query("services")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();

    const patch = {
      name: args.name.trim(),
      description: args.description,
      basePrice: Math.max(0, Math.round(args.basePrice)),
      printPrice: Math.max(0, Math.round(args.printPrice)),
      category: args.category.trim() || "custom",
      isActive: args.isActive,
      sortOrder: Math.round(args.sortOrder),
    };

    if (!patch.name) {
      throw new Error("Service name is required.");
    }

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return code;
    }

    await ctx.db.insert("services", {
      code,
      ...patch,
      createdAt: now,
    });
    return code;
  },
});

export const listTemplatesForAdmin = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const templates = await ctx.db.query("templates").take(200);
    return templates
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((template) => ({
        id: template.code,
        name: template.name,
        category: template.category,
        description: template.description,
        image_url: template.imageUrl,
        tag: template.tag,
        is_active: template.isActive,
        sort_order: template.sortOrder,
      }));
  },
});

export const upsertTemplate = mutation({
  args: {
    sessionToken: v.string(),
    code: v.string(),
    name: v.string(),
    category: v.string(),
    description: nullableString,
    imageUrl: v.string(),
    tag: nullableString,
    isActive: v.boolean(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("templates")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        category: args.category,
        description: args.description,
        imageUrl: args.imageUrl,
        tag: args.tag,
        isActive: args.isActive,
        sortOrder: args.sortOrder,
        updatedAt: now,
      });
      return args.code;
    }

    await ctx.db.insert("templates", {
      code: args.code,
      name: args.name,
      category: args.category,
      description: args.description,
      imageUrl: args.imageUrl,
      tag: args.tag,
      isActive: args.isActive,
      sortOrder: args.sortOrder,
      createdAt: now,
      updatedAt: now,
    });
    return args.code;
  },
});

export const deleteTemplate = mutation({
  args: {
    sessionToken: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const template = await ctx.db
      .query("templates")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (template) {
      await ctx.db.delete(template._id);
    }
    return null;
  },
});

export const listTestimonialsForAdmin = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const testimonials = await ctx.db.query("testimonials").take(200);
    return testimonials
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        id: item.code,
        name: item.name,
        location: item.location,
        message: item.message,
        rating: item.rating,
        is_active: item.isActive,
        sort_order: item.sortOrder,
      }));
  },
});

export const upsertTestimonial = mutation({
  args: {
    sessionToken: v.string(),
    code: v.string(),
    name: v.string(),
    location: nullableString,
    message: v.string(),
    rating: v.number(),
    isActive: v.boolean(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("testimonials")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        location: args.location,
        message: args.message,
        rating: args.rating,
        isActive: args.isActive,
        sortOrder: args.sortOrder,
        updatedAt: now,
      });
      return args.code;
    }

    await ctx.db.insert("testimonials", {
      code: args.code,
      name: args.name,
      location: args.location,
      message: args.message,
      rating: args.rating,
      isActive: args.isActive,
      sortOrder: args.sortOrder,
      createdAt: now,
      updatedAt: now,
    });
    return args.code;
  },
});

export const deleteTestimonial = mutation({
  args: {
    sessionToken: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const testimonial = await ctx.db
      .query("testimonials")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (testimonial) {
      await ctx.db.delete(testimonial._id);
    }
    return null;
  },
});

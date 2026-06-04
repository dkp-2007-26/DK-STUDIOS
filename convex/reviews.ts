import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

const nullableString = v.union(v.string(), v.null());

function serializeReview(review: {
  _id: string;
  orderId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  publicLocation: string | null;
  rating: number;
  message: string;
  status: "pending" | "approved" | "rejected";
  reviewToken: string;
  requestedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    id: review._id,
    order_id: review.orderId,
    user_id: review.userId,
    customer_name: review.customerName,
    customer_email: review.customerEmail,
    public_location: review.publicLocation,
    rating: review.rating,
    message: review.message,
    status: review.status,
    review_token: review.reviewToken,
    requested_at: review.requestedAt,
    submitted_at: review.submittedAt,
    approved_at: review.approvedAt,
    rejected_at: review.rejectedAt,
    admin_notes: review.adminNotes,
    created_at: review.createdAt,
    updated_at: review.updatedAt,
  };
}

export const getByToken = query({
  args: {
    reviewToken: v.string(),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db
      .query("reviews")
      .withIndex("by_reviewToken", (q) => q.eq("reviewToken", args.reviewToken))
      .unique();

    return review ? serializeReview(review) : null;
  },
});

export const submit = mutation({
  args: {
    reviewToken: v.string(),
    rating: v.number(),
    message: v.string(),
    publicLocation: nullableString,
  },
  handler: async (ctx, args) => {
    const review = await ctx.db
      .query("reviews")
      .withIndex("by_reviewToken", (q) => q.eq("reviewToken", args.reviewToken))
      .unique();

    if (!review) {
      throw new Error("Review link is invalid.");
    }

    const now = new Date().toISOString();
    await ctx.db.patch(review._id, {
      rating: args.rating,
      message: args.message,
      publicLocation: args.publicLocation,
      status: "pending",
      submittedAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(review.orderId, {
      reviewSubmittedAt: now,
      updatedAt: now,
    });

    const updated = await ctx.db.get(review._id);
    if (!updated) {
      throw new Error("Review not found after update.");
    }
    return serializeReview(updated);
  },
});

export const listForAdmin = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const pending = await ctx.db
      .query("reviews")
      .withIndex("by_status_and_createdAt", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(100);
    const approved = await ctx.db
      .query("reviews")
      .withIndex("by_status_and_createdAt", (q) => q.eq("status", "approved"))
      .order("desc")
      .take(100);
    const rejected = await ctx.db
      .query("reviews")
      .withIndex("by_status_and_createdAt", (q) => q.eq("status", "rejected"))
      .order("desc")
      .take(100);

    return [...pending, ...approved, ...rejected]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(serializeReview);
  },
});

export const moderate = mutation({
  args: {
    sessionToken: v.string(),
    reviewId: v.id("reviews"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    adminNotes: nullableString,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found.");
    }

    const now = new Date().toISOString();
    await ctx.db.patch(review._id, {
      status: args.status,
      approvedAt: args.status === "approved" ? now : review.approvedAt,
      rejectedAt: args.status === "rejected" ? now : review.rejectedAt,
      adminNotes: args.adminNotes,
      updatedAt: now,
    });

    const updated = await ctx.db.get(review._id);
    if (!updated) {
      throw new Error("Review not found after update.");
    }
    return serializeReview(updated);
  },
});

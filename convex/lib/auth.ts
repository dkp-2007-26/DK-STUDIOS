import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type ConvexCtx = MutationCtx | QueryCtx;

export function serializeUser(user: Doc<"users">) {
  const role = user.role ?? (user.isAdmin ? "admin" : "customer");
  return {
    id: user._id,
    email: user.email,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    isDelivery: role === "delivery",
    role,
  };
}

export async function getSessionRecord(ctx: ConvexCtx, sessionToken: string | null) {
  if (!sessionToken) {
    return null;
  }

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", sessionToken))
    .unique();

  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  return session;
}

export async function getUserFromSession(ctx: ConvexCtx, sessionToken: string | null) {
  const session = await getSessionRecord(ctx, sessionToken);
  if (!session) {
    return null;
  }

  const user = await ctx.db.get(session.userId);
  if (!user) {
    return null;
  }

  return { session, user };
}

export async function requireUser(ctx: ConvexCtx, sessionToken: string | null) {
  const result = await getUserFromSession(ctx, sessionToken);
  if (!result) {
    throw new Error("Authentication required.");
  }
  return result;
}

export async function requireAdmin(ctx: ConvexCtx, sessionToken: string | null) {
  const result = await requireUser(ctx, sessionToken);
  if (!result.user.isAdmin) {
    throw new Error("Admin access required.");
  }
  return result;
}

export async function requireDelivery(ctx: ConvexCtx, sessionToken: string | null) {
  const result = await requireUser(ctx, sessionToken);
  const role = result.user.role ?? (result.user.isAdmin ? "admin" : "customer");
  if (role !== "delivery") {
    throw new Error("Delivery access required.");
  }
  return result;
}

export async function requireStaff(ctx: ConvexCtx, sessionToken: string | null) {
  const result = await requireUser(ctx, sessionToken);
  const role = result.user.role ?? (result.user.isAdmin ? "admin" : "customer");
  if (role !== "admin" && role !== "delivery") {
    throw new Error("Staff access required.");
  }
  return result;
}

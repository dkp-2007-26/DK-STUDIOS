import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserFromSession, serializeUser } from "./lib/auth";

const sessionTokenValidator = v.union(v.string(), v.null());

export const getCurrentUser = query({
  args: {
    sessionToken: sessionTokenValidator,
  },
  handler: async (ctx, args) => {
    const result = await getUserFromSession(ctx, args.sessionToken);
    return result ? serializeUser(result.user) : null;
  },
});

export const signUp = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    const now = new Date().toISOString();
    await ctx.db.insert("users", {
      email,
      displayName: args.name.trim(),
      passwordHash: args.passwordHash,
      isAdmin: false,
      role: "customer",
      createdAt: now,
      updatedAt: now,
    });

    return null;
  },
});

export const signIn = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!user || user.passwordHash !== args.passwordHash) {
      throw new Error("Invalid email or password.");
    }

    const sessionToken = crypto.randomUUID();
    const now = Date.now();
    await ctx.db.insert("sessions", {
      token: sessionToken,
      userId: user._id,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString(),
    });

    return {
      sessionToken,
      user: serializeUser(user),
    };
  },
});

export const signOut = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return null;
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreate = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { lastActiveAt: Date.now() });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      sessionId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });
  },
});

export const get = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .first();
  },
});

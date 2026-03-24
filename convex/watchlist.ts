import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    year: v.optional(v.string()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { userId, title, year, reason }) => {
    return await ctx.db.insert("watchlist", {
      userId,
      title,
      year,
      reason,
      addedAt: Date.now(),
      watched: false,
    });
  },
});

export const markWatched = mutation({
  args: { id: v.id("watchlist") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { watched: true });
  },
});

export const remove = mutation({
  args: { id: v.id("watchlist") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("watchlist")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

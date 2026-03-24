import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const set = mutation({
  args: {
    userId: v.id("users"),
    key: v.string(),
    value: v.string(),
    source: v.string(),
  },
  handler: async (ctx, { userId, key, value, source }) => {
    // Upsert: check if key exists for user
    const existing = await ctx.db
      .query("preferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("key"), key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value, source, learnedAt: Date.now() });
      return existing._id;
    }

    return await ctx.db.insert("preferences", {
      userId,
      key,
      value,
      learnedAt: Date.now(),
      source,
    });
  },
});

export const getAll = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("preferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

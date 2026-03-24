import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User sessions (anonymous or authenticated)
  users: defineTable({
    sessionId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    createdAt: v.number(),
    lastActiveAt: v.number(),
  }).index("by_session", ["sessionId"]),

  // Chat messages
  messages: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId", "createdAt"]),

  // User preferences learned by Vinny
  preferences: defineTable({
    userId: v.id("users"),
    key: v.string(), // e.g., "favorite_genre", "favorite_director", "mood_preference"
    value: v.string(),
    learnedAt: v.number(),
    source: v.string(), // message excerpt that revealed this
  }).index("by_user", ["userId"]),

  // Watchlist
  watchlist: defineTable({
    userId: v.id("users"),
    title: v.string(),
    year: v.optional(v.string()),
    reason: v.optional(v.string()), // Why Vinny recommended it
    addedAt: v.number(),
    watched: v.boolean(),
  }).index("by_user", ["userId"]),
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Add a quote to favorites
export const addFavorite = mutation({
  args: {
    quoteId: v.number(),
    quote: v.string(),
    author: v.string(),
    topics: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already favorited
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_quote", (q) =>
        q.eq("userId", userId).eq("quoteId", args.quoteId),
      )
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("favorites", {
      userId,
      quoteId: args.quoteId,
      quote: args.quote,
      author: args.author,
      topics: args.topics,
      createdAt: Date.now(),
    });
  },
});

// Remove a quote from favorites
export const removeFavorite = mutation({
  args: {
    quoteId: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_quote", (q) =>
        q.eq("userId", userId).eq("quoteId", args.quoteId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

// Get all favorites for the current user
export const getFavorites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Check if a specific quote is favorited
export const isFavorited = query({
  args: {
    quoteId: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_quote", (q) =>
        q.eq("userId", userId).eq("quoteId", args.quoteId),
      )
      .unique();

    return !!existing;
  },
});

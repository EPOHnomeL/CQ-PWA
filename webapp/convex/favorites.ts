import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Add a quote to favorites
export const addFavorite = mutation({
  args: {
    quoteId: v.number(),
    quote: v.string(),
    author: v.string(),
    topics: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    // Check if already favorited
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_quote", (q) =>
        q.eq("userId", user._id).eq("quoteId", args.quoteId),
      )
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("favorites", {
      userId: user._id,
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_quote", (q) =>
        q.eq("userId", user._id).eq("quoteId", args.quoteId),
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return false;

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_quote", (q) =>
        q.eq("userId", user._id).eq("quoteId", args.quoteId),
      )
      .unique();

    return !!existing;
  },
});

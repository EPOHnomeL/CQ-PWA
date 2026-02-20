import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get or create the current user
export const getOrCreateUser = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingUser = await ctx.db.get(userId);
    if (existingUser) {
      // Update user fields if provided
      if (args.name || args.email || args.image) {
        await ctx.db.patch(userId, {
          ...(args.name && { name: args.name }),
          ...(args.email && { email: args.email }),
          ...(args.image && { image: args.image }),
        });
      }
      return userId;
    }

    return userId;
  },
});

// Get the current user
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db.get(userId);
  },
});

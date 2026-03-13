import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all integrations for a user
export const getIntegrations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const integrations = await ctx.db
      .query("integrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return integrations;
  },
});

// Create or update integration
export const upsertIntegration = mutation({
  args: {
    platform: v.union(
      v.literal("whatsapp"),
      v.literal("telegram"),
      v.literal("instagram"),
      v.literal("google_sheets")
    ),
    name: v.string(),
    config: v.object({
      apiKey: v.optional(v.string()),
      webhookUrl: v.optional(v.string()),
      phoneNumberId: v.optional(v.string()),
      botToken: v.optional(v.string()),
      sheetId: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if integration already exists
    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_platform", (q) => q.eq("platform", args.platform))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existing) {
      // Update existing integration
      await ctx.db.patch(existing._id, {
        name: args.name,
        config: args.config,
        isConnected: true,
        status: "connected",
        lastSync: Date.now(),
      });
      return existing._id;
    } else {
      // Create new integration
      const integrationId = await ctx.db.insert("integrations", {
        platform: args.platform,
        name: args.name,
        isActive: true,
        isConnected: true,
        userId,
        config: args.config,
        lastSync: Date.now(),
        messageCount: 0,
        errorCount: 0,
        status: "connected",
      });
      return integrationId;
    }
  },
});

// Toggle integration status
export const toggleIntegration = mutation({
  args: {
    integrationId: v.id("integrations"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const integration = await ctx.db.get(args.integrationId);
    if (!integration || integration.userId !== userId) {
      throw new Error("Integration not found or access denied");
    }

    await ctx.db.patch(args.integrationId, {
      isActive: args.isActive,
      status: args.isActive ? "connected" : "disconnected",
    });

    return args.integrationId;
  },
});

// Test integration connection
export const testIntegration = mutation({
  args: { integrationId: v.id("integrations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const integration = await ctx.db.get(args.integrationId);
    if (!integration || integration.userId !== userId) {
      throw new Error("Integration not found or access denied");
    }

    // Simulate connection test
    const isConnected = Math.random() > 0.2; // 80% success rate for demo

    await ctx.db.patch(args.integrationId, {
      isConnected,
      status: isConnected ? "connected" : "error",
      lastSync: Date.now(),
    });

    return { success: isConnected, message: isConnected ? "Connection successful" : "Connection failed" };
  },
});

// Get integration statistics
export const getIntegrationStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const integrations = await ctx.db
      .query("integrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const stats = {
      total: integrations.length,
      connected: integrations.filter(i => i.status === "connected").length,
      active: integrations.filter(i => i.isActive).length,
      totalMessages: integrations.reduce((sum, i) => sum + i.messageCount, 0),
      totalErrors: integrations.reduce((sum, i) => sum + i.errorCount, 0),
    };

    return stats;
  },
});

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all workflows for a user
export const getWorkflows = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .order("desc")
      .collect();

    return workflows;
  },
});

// Create a new workflow
export const createWorkflow = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    trigger: v.union(v.literal("message"), v.literal("schedule"), v.literal("manual")),
    conditions: v.array(v.object({
      field: v.string(),
      operator: v.string(),
      value: v.string(),
    })),
    actions: v.array(v.object({
      type: v.string(),
      config: v.object({}),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const workflowId = await ctx.db.insert("workflows", {
      ...args,
      isActive: true,
      createdBy: userId,
      executionCount: 0,
    });

    return workflowId;
  },
});

// Toggle workflow active status
export const toggleWorkflow = mutation({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.createdBy !== userId) {
      throw new Error("Workflow not found or access denied");
    }

    await ctx.db.patch(args.workflowId, {
      isActive: !workflow.isActive,
    });

    return !workflow.isActive;
  },
});

// Get bot configurations
export const getBotConfigs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const configs = await ctx.db
      .query("botConfigs")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .collect();

    return configs;
  },
});

// Create bot configuration
export const createBotConfig = mutation({
  args: {
    name: v.string(),
    model: v.string(),
    systemPrompt: v.string(),
    temperature: v.number(),
    maxTokens: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const configId = await ctx.db.insert("botConfigs", {
      ...args,
      isActive: true,
      createdBy: userId,
    });

    return configId;
  },
});

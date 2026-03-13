import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Messages table for storing bot conversations
  messages: defineTable({
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    userId: v.optional(v.id("users")),
    conversationId: v.string(),
    platform: v.optional(v.union(
      v.literal("web"),
      v.literal("whatsapp"),
      v.literal("telegram"),
      v.literal("instagram")
    )),
    metadata: v.optional(v.object({
      model: v.optional(v.string()),
      tokens: v.optional(v.number()),
      processingTime: v.optional(v.number()),
      platformMessageId: v.optional(v.string()),
      senderName: v.optional(v.string()),
      senderPhone: v.optional(v.string()),
    })),
    attachments: v.optional(v.array(v.id("_storage"))),
    isRead: v.optional(v.boolean()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"])
    .index("by_role", ["role"])
    .index("by_platform", ["platform"])
    .index("by_read_status", ["isRead"]),

  // Conversations table for grouping messages
  conversations: defineTable({
    title: v.string(),
    userId: v.optional(v.id("users")),
    status: v.union(
      v.literal("active"), // Keep existing status for backward compatibility
      v.literal("archived"),
      v.literal("deleted"),
      v.literal("unread"),
      v.literal("human_required"),
      v.literal("bot_handled"),
      v.literal("open"),
      v.literal("closed")
    ),
    lastMessageAt: v.number(),
    messageCount: v.number(),
    tags: v.optional(v.array(v.string())),
    platform: v.optional(v.union(
      v.literal("web"),
      v.literal("whatsapp"),
      v.literal("telegram"),
      v.literal("instagram")
    )),
    // Bot-Human Handover - make optional for migration
    botEnabled: v.optional(v.boolean()),
    assignedAgent: v.optional(v.id("users")),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    customerInfo: v.optional(v.object({
      name: v.optional(v.string()),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      platformId: v.optional(v.string()),
    })),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_last_message", ["lastMessageAt"])
    .index("by_platform", ["platform"])
    .index("by_bot_enabled", ["botEnabled"])
    .index("by_assigned_agent", ["assignedAgent"]),

  // System logs for monitoring bot activity
  systemLogs: defineTable({
    level: v.union(v.literal("info"), v.literal("warning"), v.literal("error"), v.literal("debug")),
    message: v.string(),
    component: v.string(),
    userId: v.optional(v.id("users")),
    metadata: v.optional(v.object({
      requestId: v.optional(v.string()),
      duration: v.optional(v.number()),
      errorCode: v.optional(v.string()),
      platform: v.optional(v.string()),
    })),
  })
    .index("by_level", ["level"])
    .index("by_component", ["component"])
    .index("by_user", ["userId"]),

  // Bot configurations
  botConfigs: defineTable({
    name: v.string(),
    model: v.string(),
    systemPrompt: v.string(),
    temperature: v.number(),
    maxTokens: v.number(),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    settings: v.optional(v.object({
      enableFileUploads: v.optional(v.boolean()),
      autoRespond: v.optional(v.boolean()),
      responseDelay: v.optional(v.number()),
      handoverKeywords: v.optional(v.array(v.string())),
    })),
  })
    .index("by_active", ["isActive"])
    .index("by_creator", ["createdBy"]),

  // Workflows for automation
  workflows: defineTable({
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
    isActive: v.boolean(),
    createdBy: v.id("users"),
    executionCount: v.number(),
    lastExecuted: v.optional(v.number()),
  })
    .index("by_active", ["isActive"])
    .index("by_trigger", ["trigger"])
    .index("by_creator", ["createdBy"]),

  // Platform Integrations
  integrations: defineTable({
    platform: v.union(
      v.literal("whatsapp"),
      v.literal("telegram"),
      v.literal("instagram"),
      v.literal("google_sheets")
    ),
    name: v.string(),
    isActive: v.boolean(),
    isConnected: v.boolean(),
    userId: v.id("users"),
    config: v.object({
      apiKey: v.optional(v.string()),
      webhookUrl: v.optional(v.string()),
      phoneNumberId: v.optional(v.string()),
      botToken: v.optional(v.string()),
      sheetId: v.optional(v.string()),
    }),
    lastSync: v.optional(v.number()),
    messageCount: v.number(),
    errorCount: v.number(),
    status: v.union(
      v.literal("connected"),
      v.literal("disconnected"),
      v.literal("error"),
      v.literal("pending")
    ),
  })
    .index("by_platform", ["platform"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

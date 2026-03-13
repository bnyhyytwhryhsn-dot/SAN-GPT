import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Get conversations by status for smart inbox
export const getConversationsByStatus = query({
  args: { 
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("archived"), 
      v.literal("deleted"),
      v.literal("unread"),
      v.literal("human_required"),
      v.literal("bot_handled"),
      v.literal("open"),
      v.literal("closed")
    ))
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let conversations;
    
    if (args.status) {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      conversations = await ctx.db
        .query("conversations")
        .order("desc")
        .collect();
    }

    // Get unread message counts for each conversation
    const conversationsWithCounts = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .filter((q) => q.eq(q.field("isRead"), false))
          .collect();

        return {
          ...conv,
          unreadCount: unreadCount.length,
        };
      })
    );

    return conversationsWithCounts;
  },
});

// Get inbox statistics
export const getInboxStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const [unread, humanRequired, botHandled, open, closed] = await Promise.all([
      ctx.db.query("conversations").withIndex("by_status", (q) => q.eq("status", "unread")).collect(),
      ctx.db.query("conversations").withIndex("by_status", (q) => q.eq("status", "human_required")).collect(),
      ctx.db.query("conversations").withIndex("by_status", (q) => q.eq("status", "bot_handled")).collect(),
      ctx.db.query("conversations").withIndex("by_status", (q) => q.eq("status", "open")).collect(),
      ctx.db.query("conversations").withIndex("by_status", (q) => q.eq("status", "closed")).collect(),
    ]);

    return {
      unread: unread.length,
      humanRequired: humanRequired.length,
      botHandled: botHandled.length,
      open: open.length,
      closed: closed.length,
      total: unread.length + humanRequired.length + botHandled.length + open.length + closed.length,
    };
  },
});

// Update conversation status
export const updateConversationStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    status: v.union(
      v.literal("active"),
      v.literal("archived"),
      v.literal("deleted"),
      v.literal("unread"),
      v.literal("human_required"),
      v.literal("bot_handled"),
      v.literal("open"),
      v.literal("closed")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.conversationId, {
      status: args.status,
    });

    return args.conversationId;
  },
});

// Toggle bot for conversation (Bot-Human Handover)
export const toggleBotForConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    botEnabled: v.boolean(),
    assignedAgent: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(args.conversationId, {
      botEnabled: args.botEnabled,
      assignedAgent: args.assignedAgent || userId,
      status: args.botEnabled ? "bot_handled" : "human_required",
    });

    // Log the handover
    await ctx.db.insert("systemLogs", {
      level: "info",
      message: `Bot ${args.botEnabled ? "enabled" : "disabled"} for conversation ${args.conversationId}`,
      component: "handover",
      userId,
      metadata: {
        requestId: args.conversationId,
      },
    });

    return args.conversationId;
  },
});

// Mark messages as read
export const markMessagesAsRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    for (const message of messages) {
      await ctx.db.patch(message._id, { isRead: true });
    }

    return messages.length;
  },
});

// Assign conversation to agent
export const assignConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    agentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.conversationId, {
      assignedAgent: args.agentId,
      status: "open",
    });

    return args.conversationId;
  },
});

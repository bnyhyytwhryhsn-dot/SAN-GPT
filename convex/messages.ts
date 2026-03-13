import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

// Get messages for a conversation
export const getMessages = query({
  args: { conversationId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    return messages;
  },
});

// Get all conversations for a user
export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return conversations;
  },
});

// Create a new conversation
export const createConversation = mutation({
  args: { 
    title: v.string(),
    platform: v.optional(v.union(
      v.literal("web"),
      v.literal("whatsapp"),
      v.literal("telegram"),
      v.literal("instagram")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const conversationId = await ctx.db.insert("conversations", {
      title: args.title,
      userId,
      status: "unread",
      lastMessageAt: Date.now(),
      messageCount: 0,
      platform: args.platform || "web",
      botEnabled: true,
      priority: "medium",
    });

    await ctx.db.insert("systemLogs", {
      level: "info",
      message: `New conversation created: ${args.title}`,
      component: "conversations",
      userId,
      metadata: {
        requestId: conversationId,
        platform: args.platform || "web",
      },
    });

    return conversationId;
  },
});

// Send a message and get AI response
export const sendMessage = action({
  args: {
    conversationId: v.string(),
    content: v.string(),
    attachments: v.optional(v.array(v.id("_storage"))),
    platform: v.optional(v.union(
      v.literal("web"),
      v.literal("whatsapp"),
      v.literal("telegram"),
      v.literal("instagram")
    )),
  },
  handler: async (ctx, args): Promise<string> => {
    const userId = await ctx.runQuery(api.auth.loggedInUser);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const startTime = Date.now();

    // Check if bot is enabled for this conversation
    const conversation = await ctx.runQuery(api.conversations.getConversationsByStatus, {});
    const currentConv = conversation.find(c => c._id === args.conversationId);
    
    // Save user message
    await ctx.runMutation(internal.messages.saveMessage, {
      conversationId: args.conversationId,
      content: args.content,
      role: "user",
      userId: userId._id,
      attachments: args.attachments,
      platform: args.platform || "web",
      isRead: false,
    });

    // Update conversation status to unread if it was closed
    if (currentConv?.status === "closed") {
      await ctx.runMutation(api.conversations.updateConversationStatus, {
        conversationId: args.conversationId as any,
        status: "unread",
      });
    }

    // Only generate AI response if bot is enabled (default to true for backward compatibility)
    if (!(currentConv?.botEnabled ?? true)) {
      // Mark conversation as requiring human attention
      await ctx.runMutation(api.conversations.updateConversationStatus, {
        conversationId: args.conversationId as any,
        status: "human_required",
      });
      
      return "Message received. A human agent will respond shortly.";
    }

    try {
      // Get conversation history for context
      const messages = await ctx.runQuery(api.messages.getMessages, {
        conversationId: args.conversationId,
      });

      // Check for handover keywords
      const handoverKeywords = ["human", "agent", "speak to someone", "transfer", "escalate"];
      const needsHuman = handoverKeywords.some(keyword => 
        args.content.toLowerCase().includes(keyword)
      );

      if (needsHuman) {
        await ctx.runMutation(api.conversations.toggleBotForConversation, {
          conversationId: args.conversationId as any,
          botEnabled: false,
        });
        
        return "I understand you'd like to speak with a human agent. Let me transfer you to someone who can help you better.";
      }

      // Prepare messages for OpenAI
      const openaiMessages: Array<{
        role: "user" | "assistant" | "system";
        content: string;
      }> = [
        {
          role: "system",
          content: "You are a helpful AI assistant for customer support. Be friendly, professional, and helpful. If you cannot help with something, suggest speaking to a human agent."
        },
        ...messages.slice(-10).map((msg) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        }))
      ];

      // Get AI response
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const aiContent: string = response.choices[0].message.content || "I apologize, but I couldn't generate a response.";
      const processingTime = Date.now() - startTime;

      // Save AI response
      await ctx.runMutation(internal.messages.saveMessage, {
        conversationId: args.conversationId,
        content: aiContent,
        role: "assistant",
        platform: args.platform || "web",
        metadata: {
          model: "gpt-4.1-nano",
          tokens: response.usage?.total_tokens,
          processingTime,
        },
        isRead: false,
      });

      // Update conversation status to bot_handled
      await ctx.runMutation(api.conversations.updateConversationStatus, {
        conversationId: args.conversationId as any,
        status: "bot_handled",
      });

      // Log successful interaction
      await ctx.runMutation(internal.messages.logInteraction, {
        level: "info",
        message: "AI response generated successfully",
        component: "ai-bot",
        userId: userId._id,
        metadata: {
          duration: processingTime,
          requestId: args.conversationId,
          platform: args.platform || "web",
        },
      });

      return aiContent;
    } catch (error) {
      // Log error
      await ctx.runMutation(internal.messages.logInteraction, {
        level: "error",
        message: `AI response failed: ${error}`,
        component: "ai-bot",
        userId: userId._id,
        metadata: {
          duration: Date.now() - startTime,
          errorCode: "AI_RESPONSE_ERROR",
          platform: args.platform || "web",
        },
      });

      throw error;
    }
  },
});

// Internal function to save messages
export const saveMessage = internalMutation({
  args: {
    conversationId: v.string(),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    userId: v.optional(v.id("users")),
    attachments: v.optional(v.array(v.id("_storage"))),
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
    isRead: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      ...args,
      isRead: args.isRead ?? false,
    });

    // Update conversation
    const conversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId))
      .first();

    if (conversation) {
      await ctx.db.patch(conversation._id, {
        lastMessageAt: Date.now(),
        messageCount: conversation.messageCount + 1,
      });
    }

    return messageId;
  },
});

// Internal function to log interactions
export const logInteraction = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("systemLogs", args);
  },
});

// Generate upload URL for file attachments
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

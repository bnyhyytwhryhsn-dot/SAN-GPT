import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get dashboard statistics
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Total conversations
    const totalConversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Messages today
    const messagesToday = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("_creationTime"), oneDayAgo))
      .collect();

    // Active conversations (with messages in last week)
    const activeConversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("lastMessageAt"), oneWeekAgo))
      .collect();

    // System errors today
    const errorsToday = await ctx.db
      .query("systemLogs")
      .withIndex("by_level", (q) => q.eq("level", "error"))
      .filter((q) => q.gte(q.field("_creationTime"), oneDayAgo))
      .collect();

    // Platform distribution
    const platformStats = {
      web: totalConversations.filter(c => c.platform === "web").length,
      whatsapp: totalConversations.filter(c => c.platform === "whatsapp").length,
      telegram: totalConversations.filter(c => c.platform === "telegram").length,
      instagram: totalConversations.filter(c => c.platform === "instagram").length,
    };

    // Bot vs Human handled
    const botHandled = totalConversations.filter(c => c.status === "bot_handled").length;
    const humanRequired = totalConversations.filter(c => c.status === "human_required").length;

    return {
      totalConversations: totalConversations.length,
      messagesToday: messagesToday.length,
      activeConversations: activeConversations.length,
      errorsToday: errorsToday.length,
      platformStats,
      botHandled,
      humanRequired,
      botEfficiency: totalConversations.length > 0 ? Math.round((botHandled / totalConversations.length) * 100) : 0,
    };
  },
});

// Get recent system logs
export const getRecentLogs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const logs = await ctx.db
      .query("systemLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    return logs;
  },
});

// Get message activity over time
export const getMessageActivity = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("_creationTime"), sevenDaysAgo))
      .collect();

    // Group messages by day and platform
    const activity = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = Date.now() - i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      
      const dayMessages = messages.filter(
        (msg) => msg._creationTime >= dayStart && msg._creationTime < dayEnd
      );

      const platformBreakdown = {
        web: dayMessages.filter(m => m.platform === "web").length,
        whatsapp: dayMessages.filter(m => m.platform === "whatsapp").length,
        telegram: dayMessages.filter(m => m.platform === "telegram").length,
        instagram: dayMessages.filter(m => m.platform === "instagram").length,
      };

      activity.push({
        date: new Date(dayStart).toLocaleDateString(),
        messages: dayMessages.length,
        userMessages: dayMessages.filter((msg) => msg.role === "user").length,
        aiMessages: dayMessages.filter((msg) => msg.role === "assistant").length,
        platformBreakdown,
      });
    }

    return activity;
  },
});

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

type ConversationStatus = "active" | "archived" | "deleted" | "unread" | "human_required" | "bot_handled" | "open" | "closed";

export function SmartInbox() {
  const [selectedStatus, setSelectedStatus] = useState<ConversationStatus | "all">("all");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const inboxStats = useQuery(api.conversations.getInboxStats);
  const conversations = useQuery(api.conversations.getConversationsByStatus, 
    selectedStatus === "all" ? {} : { status: selectedStatus }
  );
  const messages = useQuery(
    api.messages.getMessages,
    selectedConversation ? { conversationId: selectedConversation } : "skip"
  );

  const updateStatus = useMutation(api.conversations.updateConversationStatus);
  const toggleBot = useMutation(api.conversations.toggleBotForConversation);
  const markAsRead = useMutation(api.conversations.markMessagesAsRead);

  const statusTabs = [
    { id: "all" as const, label: "All", count: inboxStats?.total || 0, color: "bg-gray-100 text-gray-800" },
    { id: "unread" as const, label: "Unread", count: inboxStats?.unread || 0, color: "bg-red-100 text-red-800" },
    { id: "human_required" as const, label: "Human Required", count: inboxStats?.humanRequired || 0, color: "bg-orange-100 text-orange-800" },
    { id: "bot_handled" as const, label: "Bot Handled", count: inboxStats?.botHandled || 0, color: "bg-blue-100 text-blue-800" },
    { id: "open" as const, label: "Open", count: inboxStats?.open || 0, color: "bg-green-100 text-green-800" },
    { id: "closed" as const, label: "Closed", count: inboxStats?.closed || 0, color: "bg-gray-100 text-gray-800" },
  ];

  const handleStatusChange = async (conversationId: Id<"conversations">, newStatus: ConversationStatus) => {
    try {
      await updateStatus({ conversationId, status: newStatus });
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleBotToggle = async (conversationId: Id<"conversations">, botEnabled: boolean) => {
    try {
      await toggleBot({ conversationId, botEnabled });
      toast.success(`Bot ${botEnabled ? "enabled" : "disabled"} for conversation`);
    } catch (error) {
      toast.error("Failed to toggle bot");
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    try {
      await markAsRead({ conversationId: conversationId as Id<"conversations"> });
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case "whatsapp": return "📱";
      case "telegram": return "✈️";
      case "instagram": return "📷";
      default: return "💬";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unread": return "bg-red-100 text-red-800";
      case "human_required": return "bg-orange-100 text-orange-800";
      case "bot_handled": return "bg-blue-100 text-blue-800";
      case "open": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!inboxStats || !conversations) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Inbox Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Status Tabs */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Smart Inbox</h2>
          <div className="grid grid-cols-2 gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`p-3 rounded-lg text-left transition-colors ${
                  selectedStatus === tab.id
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{tab.label}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${tab.color}`}>
                    {tab.count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-auto">
          {conversations.map((conv) => (
            <div
              key={conv._id}
              onClick={() => handleSelectConversation(conv._id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversation === conv._id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getPlatformIcon(conv.platform)}</span>
                  <h3 className="font-medium text-gray-900 truncate">{conv.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {conv.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {conv.unreadCount}
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conv.status)}`}>
                    {conv.status.replace("_", " ")}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{conv.messageCount} messages</span>
                <span>{new Date(conv.lastMessageAt).toLocaleDateString()}</span>
              </div>
              
              {conv.customerInfo && (
                <div className="mt-2 text-sm text-gray-600">
                  {conv.customerInfo.name && <span>👤 {conv.customerInfo.name}</span>}
                  {conv.customerInfo.phone && <span className="ml-2">📞 {conv.customerInfo.phone}</span>}
                </div>
              )}
              
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${(conv.botEnabled ?? true) ? "bg-green-500" : "bg-red-500"}`}></span>
                  <span className="text-xs text-gray-600">
                    Bot {(conv.botEnabled ?? true) ? "Enabled" : "Disabled"}
                  </span>
                </div>
                {conv.assignedAgent && (
                  <span className="text-xs text-gray-600">👤 Agent Assigned</span>
                )}
              </div>
            </div>
          ))}
          
          {conversations.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-gray-600">No conversations in this category</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && messages ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {conversations.find(c => c._id === selectedConversation)?.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {messages.length} messages • Last active {new Date(conversations.find(c => c._id === selectedConversation)?.lastMessageAt || 0).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Status Dropdown */}
                  <select
                    value={conversations.find(c => c._id === selectedConversation)?.status || "open"}
                    onChange={(e) => handleStatusChange(
                      selectedConversation as Id<"conversations">,
                      e.target.value as ConversationStatus
                    )}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="unread">Unread</option>
                    <option value="human_required">Human Required</option>
                    <option value="bot_handled">Bot Handled</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                  
                  {/* Bot Toggle */}
                  <button
                    onClick={() => {
                      const conv = conversations.find(c => c._id === selectedConversation);
                      if (conv) {
                        handleBotToggle(selectedConversation as Id<"conversations">, !(conv.botEnabled ?? true));
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      (conversations.find(c => c._id === selectedConversation)?.botEnabled ?? true)
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {(conversations.find(c => c._id === selectedConversation)?.botEnabled ?? true) ? "Disable Bot" : "Enable Bot"}
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : msg.role === "assistant"
                        ? "bg-gray-100 text-gray-900"
                        : "bg-yellow-100 text-yellow-900"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.metadata?.senderName && (
                      <div className="text-xs mt-1 opacity-75">
                        From: {msg.metadata.senderName}
                      </div>
                    )}
                    <div className="text-xs mt-1 opacity-75">
                      {new Date(msg._creationTime).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">📬</div>
              <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
              <p>Choose a conversation from the inbox to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

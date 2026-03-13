import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function StatsCards() {
  const stats = useQuery(api.dashboard.getDashboardStats);

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Conversations",
      value: stats.totalConversations,
      icon: "💬",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      subtitle: `${stats.activeConversations} active this week`,
    },
    {
      title: "Messages Today",
      value: stats.messagesToday,
      icon: "📝",
      color: "text-green-600",
      bgColor: "bg-green-50",
      subtitle: "Across all platforms",
    },
    {
      title: "Bot Efficiency",
      value: `${stats.botEfficiency}%`,
      icon: "🤖",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      subtitle: `${stats.botHandled} bot handled`,
    },
    {
      title: "Errors Today",
      value: stats.errorsToday,
      icon: "⚠️",
      color: "text-red-600",
      bgColor: "bg-red-50",
      subtitle: "System errors",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <span className="text-2xl">{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">💻</div>
            <div className="text-2xl font-bold text-blue-600">{stats.platformStats.web}</div>
            <div className="text-sm text-gray-600">Web</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">📱</div>
            <div className="text-2xl font-bold text-green-600">{stats.platformStats.whatsapp}</div>
            <div className="text-sm text-gray-600">WhatsApp</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">✈️</div>
            <div className="text-2xl font-bold text-blue-500">{stats.platformStats.telegram}</div>
            <div className="text-sm text-gray-600">Telegram</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-2xl font-bold text-pink-600">{stats.platformStats.instagram}</div>
            <div className="text-sm text-gray-600">Instagram</div>
          </div>
        </div>
      </div>
    </div>
  );
}

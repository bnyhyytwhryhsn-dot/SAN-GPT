import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ChatInterface } from "./ChatInterface";
import { StatsCards } from "./StatsCards";
import { ActivityChart } from "./ActivityChart";
import { SystemLogs } from "./SystemLogs";
import { WorkflowManager } from "./WorkflowManager";
import { SmartInbox } from "./SmartInbox";
import { IntegrationsPanel } from "./IntegrationsPanel";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("inbox");
  const user = useQuery(api.auth.loggedInUser);

  const tabs = [
    { id: "inbox", label: "Smart Inbox", icon: "📬" },
    { id: "chat", label: "Chat", icon: "💬" },
    { id: "integrations", label: "Integrations", icon: "🔗" },
    { id: "dashboard", label: "Analytics", icon: "📊" },
    { id: "workflows", label: "Workflows", icon: "⚙️" },
    { id: "logs", label: "System Logs", icon: "📋" },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Welcome back!</h3>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === "inbox" && <SmartInbox />}
        {activeTab === "chat" && <ChatInterface />}
        {activeTab === "integrations" && <IntegrationsPanel />}
        {activeTab === "dashboard" && <DashboardOverview />}
        {activeTab === "workflows" && <WorkflowManager />}
        {activeTab === "logs" && <SystemLogs />}
      </div>
    </div>
  );
}

function DashboardOverview() {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor your AI bot system performance and activity</p>
        </div>
        
        <StatsCards />
        <ActivityChart />
      </div>
    </div>
  );
}

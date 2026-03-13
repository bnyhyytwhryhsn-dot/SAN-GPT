import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

type Platform = "whatsapp" | "telegram" | "instagram" | "google_sheets";

export function IntegrationsPanel() {
  const [showConfigModal, setShowConfigModal] = useState<Platform | null>(null);
  
  const integrations = useQuery(api.integrations.getIntegrations);
  const integrationStats = useQuery(api.integrations.getIntegrationStats);
  const upsertIntegration = useMutation(api.integrations.upsertIntegration);
  const toggleIntegration = useMutation(api.integrations.toggleIntegration);
  const testIntegration = useMutation(api.integrations.testIntegration);

  const platformConfigs = {
    whatsapp: {
      name: "WhatsApp Business API",
      icon: "📱",
      color: "bg-green-50 border-green-200",
      description: "Connect to WhatsApp Business API for customer messaging",
      fields: [
        { key: "apiKey", label: "API Key", type: "password" },
        { key: "phoneNumberId", label: "Phone Number ID", type: "text" },
        { key: "webhookUrl", label: "Webhook URL", type: "url" },
      ],
    },
    telegram: {
      name: "Telegram Bot",
      icon: "✈️",
      color: "bg-blue-50 border-blue-200",
      description: "Connect your Telegram bot for automated responses",
      fields: [
        { key: "botToken", label: "Bot Token", type: "password" },
        { key: "webhookUrl", label: "Webhook URL", type: "url" },
      ],
    },
    instagram: {
      name: "Instagram Business",
      icon: "📷",
      color: "bg-pink-50 border-pink-200",
      description: "Connect Instagram Business account for DM automation",
      fields: [
        { key: "apiKey", label: "Access Token", type: "password" },
        { key: "webhookUrl", label: "Webhook URL", type: "url" },
      ],
    },
    google_sheets: {
      name: "Google Sheets",
      icon: "📊",
      color: "bg-emerald-50 border-emerald-200",
      description: "Sync conversation data with Google Sheets",
      fields: [
        { key: "apiKey", label: "Service Account Key", type: "password" },
        { key: "sheetId", label: "Sheet ID", type: "text" },
      ],
    },
  };

  const getIntegrationByPlatform = (platform: Platform) => {
    return integrations?.find(i => i.platform === platform);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "bg-green-100 text-green-800";
      case "disconnected": return "bg-gray-100 text-gray-800";
      case "error": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleToggle = async (integrationId: Id<"integrations">, isActive: boolean) => {
    try {
      await toggleIntegration({ integrationId, isActive });
      toast.success(`Integration ${isActive ? "enabled" : "disabled"}`);
    } catch (error) {
      toast.error("Failed to toggle integration");
    }
  };

  const handleTest = async (integrationId: Id<"integrations">) => {
    try {
      const result = await testIntegration({ integrationId });
      if (result.success) {
        toast.success("Connection test successful!");
      } else {
        toast.error("Connection test failed");
      }
    } catch (error) {
      toast.error("Failed to test connection");
    }
  };

  if (!integrations || !integrationStats) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Platform Integrations</h1>
          <p className="text-gray-600">Connect and manage your messaging platforms</p>
        </div>

        {/* Integration Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Integrations</p>
                <p className="text-2xl font-bold text-blue-600">{integrationStats.total}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <span className="text-2xl">🔗</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connected</p>
                <p className="text-2xl font-bold text-green-600">{integrationStats.connected}</p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages Processed</p>
                <p className="text-2xl font-bold text-purple-600">{integrationStats.totalMessages}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <span className="text-2xl">📨</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{integrationStats.totalErrors}</p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.keys(platformConfigs) as Platform[]).map((platform) => {
            const config = platformConfigs[platform];
            const integration = getIntegrationByPlatform(platform);
            
            return (
              <div key={platform} className={`bg-white rounded-lg shadow p-6 border-2 ${config.color}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{config.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </div>
                  </div>
                  
                  {integration && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(integration.status)}`}>
                      {integration.status}
                    </span>
                  )}
                </div>

                {integration ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Messages:</span>
                      <span className="font-medium">{integration.messageCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last Sync:</span>
                      <span className="font-medium">
                        {integration.lastSync ? new Date(integration.lastSync).toLocaleString() : "Never"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Errors:</span>
                      <span className="font-medium text-red-600">{integration.errorCount}</span>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleToggle(integration._id, !integration.isActive)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          integration.isActive
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {integration.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleTest(integration._id)}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => setShowConfigModal(platform)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-3">Not configured</p>
                    <button
                      onClick={() => setShowConfigModal(platform)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Setup Integration
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Configuration Modal */}
        {showConfigModal && (
          <IntegrationConfigModal
            platform={showConfigModal}
            config={platformConfigs[showConfigModal]}
            existingIntegration={getIntegrationByPlatform(showConfigModal)}
            onClose={() => setShowConfigModal(null)}
            onSave={upsertIntegration}
          />
        )}
      </div>
    </div>
  );
}

function IntegrationConfigModal({
  platform,
  config,
  existingIntegration,
  onClose,
  onSave,
}: {
  platform: Platform;
  config: any;
  existingIntegration?: any;
  onClose: () => void;
  onSave: any;
}) {
  const [formData, setFormData] = useState({
    name: existingIntegration?.name || config.name,
    config: existingIntegration?.config || {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave({
        platform,
        name: formData.name,
        config: formData.config,
      });
      toast.success("Integration configured successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to configure integration");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{config.icon}</span>
          <h3 className="text-lg font-semibold">Configure {config.name}</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Integration Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          {config.fields.map((field: any) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                type={field.type}
                value={formData.config[field.key] || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, [field.key]: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          ))}
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

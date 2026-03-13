import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function SystemLogs() {
  const logs = useQuery(api.dashboard.getRecentLogs);

  if (!logs) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error": return "text-red-600 bg-red-50";
      case "warning": return "text-yellow-600 bg-yellow-50";
      case "info": return "text-blue-600 bg-blue-50";
      case "debug": return "text-gray-600 bg-gray-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error": return "❌";
      case "warning": return "⚠️";
      case "info": return "ℹ️";
      case "debug": return "🐛";
      default: return "📝";
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600">Monitor system activity and troubleshoot issues</p>
        </div>

        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log._id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg">{getLevelIcon(log.level)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">{log.component}</span>
                    <span className="text-sm text-gray-400">
                      {new Date(log._creationTime).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-900">{log.message}</p>
                  {log.metadata && (
                    <div className="mt-2 text-sm text-gray-600">
                      {log.metadata.duration && (
                        <span className="mr-4">Duration: {log.metadata.duration}ms</span>
                      )}
                      {log.metadata.requestId && (
                        <span className="mr-4">Request ID: {log.metadata.requestId}</span>
                      )}
                      {log.metadata.errorCode && (
                        <span className="text-red-600">Error: {log.metadata.errorCode}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {logs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No logs yet</h3>
              <p className="text-gray-600">System logs will appear here as your bot processes messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

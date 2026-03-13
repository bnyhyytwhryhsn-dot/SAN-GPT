import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function ActivityChart() {
  const activity = useQuery(api.dashboard.getMessageActivity);

  if (!activity) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const maxMessages = Math.max(...activity.map(day => day.messages), 1);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Activity (Last 7 Days)</h3>
      
      <div className="space-y-4">
        {activity.map((day, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-20 text-sm text-gray-600">{day.date}</div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(day.userMessages / maxMessages) * 100}%` }}
                ></div>
                <div
                  className="bg-green-500 h-full rounded-full absolute top-0 transition-all duration-300"
                  style={{ 
                    left: `${(day.userMessages / maxMessages) * 100}%`,
                    width: `${(day.aiMessages / maxMessages) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 w-16 text-right">
                {day.messages} msgs
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>User Messages</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>AI Messages</span>
        </div>
      </div>
    </div>
  );
}

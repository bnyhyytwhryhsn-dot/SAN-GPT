import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function WorkflowManager() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const workflows = useQuery(api.workflows.getWorkflows);
  const botConfigs = useQuery(api.workflows.getBotConfigs);
  const toggleWorkflow = useMutation(api.workflows.toggleWorkflow);

  const handleToggleWorkflow = async (workflowId: Id<"workflows">) => {
    try {
      await toggleWorkflow({ workflowId });
      toast.success("Workflow status updated");
    } catch (error) {
      toast.error("Failed to update workflow");
    }
  };

  if (!workflows || !botConfigs) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workflow Automation</h1>
            <p className="text-gray-600">Automate your AI bot responses and actions</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create Workflow
          </button>
        </div>

        {/* Bot Configurations */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bot Configurations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {botConfigs.map((config) => (
              <div key={config._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{config.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    config.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {config.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Model: {config.model}</p>
                <p className="text-sm text-gray-600">Temperature: {config.temperature}</p>
              </div>
            ))}
            
            {botConfigs.length === 0 && (
              <div className="col-span-full text-center py-8">
                <div className="text-4xl mb-2">🤖</div>
                <p className="text-gray-600">No bot configurations yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Workflows */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflows</h2>
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div key={workflow._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{workflow.name}</h3>
                    <p className="text-gray-600">{workflow.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      workflow.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {workflow.isActive ? "Active" : "Inactive"}
                    </span>
                    <button
                      onClick={() => handleToggleWorkflow(workflow._id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        workflow.isActive
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {workflow.isActive ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Trigger:</span>
                    <p className="text-gray-600 capitalize">{workflow.trigger}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Executions:</span>
                    <p className="text-gray-600">{workflow.executionCount}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Last Run:</span>
                    <p className="text-gray-600">
                      {workflow.lastExecuted 
                        ? new Date(workflow.lastExecuted).toLocaleDateString()
                        : "Never"
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {workflows.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚙️</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No workflows yet</h3>
                <p className="text-gray-600">Create your first workflow to automate bot responses</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Workflow Modal */}
        {showCreateForm && (
          <CreateWorkflowModal onClose={() => setShowCreateForm(false)} />
        )}
      </div>
    </div>
  );
}

function CreateWorkflowModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger: "message" as const,
  });

  const createWorkflow = useMutation(api.workflows.createWorkflow);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWorkflow({
        ...formData,
        conditions: [
          { field: "content", operator: "contains", value: "hello" }
        ],
        actions: [
          { type: "respond", config: {} }
        ],
      });
      toast.success("Workflow created successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to create workflow");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create New Workflow</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workflow Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trigger
            </label>
            <select
              value={formData.trigger}
              onChange={(e) => setFormData({ ...formData, trigger: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="message">On Message</option>
              <option value="schedule">On Schedule</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          
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
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

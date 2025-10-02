import React from 'react';
import { Trash2, Sparkles, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Task } from '../hooks/useTasks';
import { useSubtasks } from '../hooks/useSubtasks';
import SubtaskItem from './SubtaskItem';

interface TaskItemProps {
  task: Task;
  onUpdateStatus: (id: string, status: Task['status']) => void;
  onUpdatePriority: (id: string, priority: Task['priority']) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-red-100 text-red-800 border-red-200'
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  done: 'bg-green-100 text-green-800 border-green-200'
};

function TaskItem({ task, onUpdateStatus, onUpdatePriority, onDelete }: TaskItemProps) {
  const { subtasks, addSubtask, updateSubtask, deleteSubtask, generateSubtasks } = useSubtasks(task.id);
  const [showSubtasks, setShowSubtasks] = React.useState(false);
  const [generatedSuggestions, setGeneratedSuggestions] = React.useState<string[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerateSubtasks = async () => {
    setLoadingSubtasks(true);
    setError(null);
    const { subtasks: suggestions, error } = await generateSubtasks(task.title);
    
    if (error) {
      setError(error);
      setShowSuggestions(false);
    } else if (suggestions && suggestions.length > 0) {
      setGeneratedSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setError('No subtasks were generated. Please try again.');
      setShowSuggestions(false);
    }
    setLoadingSubtasks(false);
  };

  const handleSaveSubtask = async (suggestion: string) => {
    const { error } = await addSubtask(suggestion, 'medium');
    if (!error) {
      setGeneratedSuggestions(prev => prev.filter(s => s !== suggestion));
      setShowSubtasks(true);
      
      // If no more suggestions, hide the suggestions panel
      if (generatedSuggestions.length === 1) {
        setShowSuggestions(false);
      }
    }
  };

  const handleDismissSuggestions = () => {
    setShowSuggestions(false);
    setGeneratedSuggestions([]);
    setError(null);
  };

  const handleUpdateSubtaskStatus = async (id: string, status: any) => {
    await updateSubtask(id, { status });
  };

  const handleUpdateSubtaskPriority = async (id: string, priority: any) => {
    await updateSubtask(id, { priority });
  };

  const handleDeleteSubtask = async (id: string) => {
    if (confirm('Are you sure you want to delete this subtask?')) {
      await deleteSubtask(id);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between p-4">
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.title}
          </h3>
          <div className="flex items-center gap-3 mt-2">
            <select
              value={task.priority}
              onChange={(e) => onUpdatePriority(task.id, e.target.value as Task['priority'])}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${priorityColors[task.priority]} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            
            <select
              value={task.status}
              onChange={(e) => onUpdateStatus(task.id, e.target.value as Task['status'])}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[task.status]} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            {subtasks.length > 0 && (
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                {showSubtasks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {subtasks.length} subtask{subtasks.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onDelete(task.id)}
          className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
          title="Delete task"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Generate Subtasks Button */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateSubtasks}
            disabled={loadingSubtasks}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={16} />
            {loadingSubtasks ? 'Generating...' : 'Generate Subtasks with AI'}
          </button>
          
          {(showSuggestions || error) && (
            <button
              onClick={handleDismissSuggestions}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200"
              title="Dismiss suggestions"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* AI Suggestions */}
        {showSuggestions && generatedSuggestions.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-800">AI Suggested Subtasks:</h4>
              <span className="text-xs text-blue-600">{generatedSuggestions.length} suggestions</span>
            </div>
            <div className="space-y-2">
              {generatedSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start justify-between p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                  <span className="text-sm text-gray-700 flex-1 pr-3 leading-relaxed">{suggestion}</span>
                  <button
                    onClick={() => handleSaveSubtask(suggestion)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 whitespace-nowrap"
                  >
                    Save
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subtasks List */}
        {showSubtasks && subtasks.length > 0 && (
          <div className="mt-3 space-y-2">
            {subtasks.map((subtask) => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                onUpdateStatus={handleUpdateSubtaskStatus}
                onUpdatePriority={handleUpdateSubtaskPriority}
                onDelete={handleDeleteSubtask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskItem;
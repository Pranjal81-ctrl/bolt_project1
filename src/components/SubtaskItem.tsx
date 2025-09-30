import React from 'react';
import { Trash2 } from 'lucide-react';
import { Subtask } from '../hooks/useSubtasks';

interface SubtaskItemProps {
  subtask: Subtask;
  onUpdateStatus: (id: string, status: Subtask['status']) => void;
  onUpdatePriority: (id: string, priority: Subtask['priority']) => void;
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

function SubtaskItem({ subtask, onUpdateStatus, onUpdatePriority, onDelete }: SubtaskItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 ml-6">
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-medium ${subtask.status === 'done' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
          {subtask.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <select
            value={subtask.priority}
            onChange={(e) => onUpdatePriority(subtask.id, e.target.value as Subtask['priority'])}
            className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[subtask.priority]} focus:outline-none focus:ring-1 focus:ring-blue-500`}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          
          <select
            value={subtask.status}
            onChange={(e) => onUpdateStatus(subtask.id, e.target.value as Subtask['status'])}
            className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[subtask.status]} focus:outline-none focus:ring-1 focus:ring-blue-500`}
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
      
      <button
        onClick={() => onDelete(subtask.id)}
        className="ml-3 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200"
        title="Delete subtask"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default SubtaskItem;
import React from 'react';
import { Trash2, Edit3 } from 'lucide-react';
import { Task } from '../hooks/useTasks';

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
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
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
  );
}

export default TaskItem;
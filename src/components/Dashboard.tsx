import React, { useState } from 'react';
import { Plus, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTasks, Task } from '../hooks/useTasks';
import TaskItem from './TaskItem';
import ProfilePage from './ProfilePage';

interface DashboardProps {
  onLogout: () => void;
}

function Dashboard({ onLogout }: DashboardProps) {
  const { user, signOut } = useAuth();
  const { tasks, loading: tasksLoading, error: tasksError, addTask, updateTask, deleteTask } = useTasks();
  const [newTask, setNewTask] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim() && !addingTask) {
      setAddingTask(true);
      const { error } = await addTask(newTask.trim(), newTaskPriority);
      if (!error) {
        setNewTask('');
        setNewTaskPriority('medium');
      }
      setAddingTask(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: Task['status']) => {
    await updateTask(id, { status });
  };

  const handleUpdatePriority = async (id: string, priority: Task['priority']) => {
    await updateTask(id, { priority });
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(id);
      setNewTask('');
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await signOut();
    onLogout();
  };

  const handleShowProfile = () => {
    setShowProfile(true);
  };

  const handleBackFromProfile = () => {
    setShowProfile(false);
  };

  if (showProfile) {
    return <ProfilePage onBack={handleBackFromProfile} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-100 to-cyan-100 flex items-center justify-center p-4 font-open-sans">
      <div className="w-full max-w-2xl mx-auto">
        {/* Dashboard Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          {/* Heading */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <button
                  onClick={handleShowProfile}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="View Profile"
                >
                  <User size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="text-lg font-semibold text-blue-600">
                {user?.user_metadata?.name || user?.email || 'User'}
              </p>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Your Tasks
            </h1>
            <p className="text-gray-600">Manage your daily tasks efficiently</p>
          </div>

          {/* Task List */}
          <div className="mb-8 space-y-4">
            {tasksLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading tasks...</p>
              </div>
            ) : tasksError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-center">
                Error loading tasks: {tasksError}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2">No tasks yet!</p>
                <p>Add your first task below to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdatePriority={handleUpdatePriority}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Add New Task Form */}
          <form onSubmit={handleAddTask} className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label htmlFor="newTask" className="block text-sm font-semibold text-gray-700 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  id="newTask"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-400"
                  placeholder="Enter a new task"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={addingTask || !newTask.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              {addingTask ? 'Adding Task...' : 'Add Task'}
            </button>
          </form>

          {/* Task Statistics */}
          {tasks.length > 0 && (
            <div className="mb-8 grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {tasks.filter(task => task.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {tasks.filter(task => task.status === 'in-progress').length}
                </div>
                <div className="text-sm text-blue-500">In Progress</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {tasks.filter(task => task.status === 'done').length}
                </div>
                <div className="text-sm text-green-500">Done</div>
              </div>
            </div>
          )}

          {/* Legacy form removal */}
          <form onSubmit={handleAddTask} className="mb-8" style={{ display: 'none' }}>
            <div className="mb-4" style={{ display: 'none' }}>
              <label htmlFor="newTask" className="block text-sm font-semibold text-gray-700 mb-2">
                New Task
              </label>
              <input
                type="text"
                id="newTask"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-400"
                placeholder="Enter a new task"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" 
              style={{ display: 'none' }}
            >
              Add Task
            </button>
          </form>

          {/* Logout Button */}
          <div className="flex gap-4">
            <button
              onClick={handleShowProfile}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-200 hover:border-blue-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <User size={20} />
              Profile
            </button>
            
            <button
              onClick={handleLogout}
              disabled={loading}
              className="flex-1 bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 disabled:text-gray-500 font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 transform hover:-translate-y-1 disabled:transform-none disabled:cursor-not-allowed"
            >
              {loading ? 'Signing out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
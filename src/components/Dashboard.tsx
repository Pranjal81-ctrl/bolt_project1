import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface DashboardProps {
  onLogout: () => void;
}

function Dashboard({ onLogout }: DashboardProps) {
  const { user, signOut } = useAuth();
  const [tasks, setTasks] = useState([
    'Finish homework',
    'Call John',
    'Buy groceries'
  ]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      setTasks([...tasks, newTask.trim()]);
      setNewTask('');
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-100 to-cyan-100 flex items-center justify-center p-4 font-open-sans">
      <div className="w-full max-w-2xl mx-auto">
        {/* Dashboard Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          {/* Heading */}
          <div className="text-center mb-8">
            <div className="mb-4">
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
          <div className="mb-8">
            <ul className="space-y-3">
              {tasks.map((task, index) => (
                <li key={index} className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-blue-600 font-semibold mr-3">{index + 1}.</span>
                  <span className="text-gray-700">{task}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Add New Task Form */}
          <form onSubmit={handleAddTask} className="mb-8">
            <div className="mb-4">
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
            >
              Add Task
            </button>
          </form>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 disabled:text-gray-500 font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 transform hover:-translate-y-1 disabled:transform-none disabled:cursor-not-allowed"
          >
            {loading ? 'Signing out...' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
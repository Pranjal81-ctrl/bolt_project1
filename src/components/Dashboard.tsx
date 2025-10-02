import React, { useState } from 'react';
import { Plus, User, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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

  const handleSmartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !user) return;

    setSearching(true);
    setSearchError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-search`;
      
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          query: searchQuery.trim(),
          userId: user.id 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Search failed`);
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setSearchError(errorMessage);
      console.error('Smart search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
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

          {/* Smart Search Section */}
          <div className="mb-8">
            <form onSubmit={handleSmartSearch} className="mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label htmlFor="smartSearch" className="block text-sm font-semibold text-gray-700 mb-2">
                    Smart Search
                  </label>
                  <input
                    type="text"
                    id="smartSearch"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-400"
                    placeholder="Search tasks using natural language..."
                  />
                </div>
                <div className="flex gap-2 sm:items-end sm:pb-0">
                  <button
                    type="submit"
                    disabled={searching || !searchQuery.trim()}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none"
                  >
                    {searching ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search size={18} />
                        Search
                      </>
                    )}
                  </button>
                  {(searchResults.length > 0 || searchError) && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* Search Error */}
            {searchError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                <p className="text-sm">{searchError}</p>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-800">
                    Smart Search Results
                  </h3>
                  <span className="text-sm text-blue-600">
                    {searchResults.length} similar task{searchResults.length !== 1 ? 's' : ''} found
                  </span>
                </div>
                <div className="space-y-3">
                  {searchResults.map((result, index) => (
                    <div
                      key={result.id}
                      className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">
                            {result.title}
                          </h4>
                          <div className="flex items-center gap-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              result.priority === 'high' ? 'bg-red-100 text-red-800' :
                              result.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {result.priority} priority
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              result.status === 'done' ? 'bg-green-100 text-green-800' :
                              result.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {result.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm font-medium text-blue-600">
                            {Math.round(result.similarity * 100)}% match
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(result.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results Message */}
            {searchQuery && !searching && searchResults.length === 0 && !searchError && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                <p className="text-gray-600">
                  No similar tasks found with similarity above 70%.
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Try using different keywords or phrases.
                </p>
              </div>
            )}
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
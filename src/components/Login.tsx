import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface LoginProps {
  onBack: () => void;
  onSuccess: () => void;
}

function Login({ onBack, onSuccess }: LoginProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-100 to-cyan-100 flex items-center justify-center p-4 font-open-sans">
      <div className="w-full max-w-md mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
        >
          ← Back to Home
        </button>

        {/* Login Form Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Login
            </h1>
            <p className="text-gray-600">Welcome back to My Task Manager</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-400"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-400"
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 mt-8 disabled:transform-none"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                Sign up here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
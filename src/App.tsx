import React from 'react';

function App() {
  const handleLogin = () => {
    console.log('Login clicked');
    // Add login functionality here
  };

  const handleSignup = () => {
    console.log('Signup clicked');
    // Add signup functionality here
  };

  const handleDashboard = () => {
    console.log('Go to Dashboard clicked');
    // Add dashboard navigation here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-100 to-cyan-100 flex items-center justify-center p-4 font-open-sans">
      <div className="w-full max-w-4xl mx-auto text-center">
        {/* Main Heading */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              My Task Manager
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Organize your tasks, boost your productivity, and achieve your goals with our intuitive task management solution.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-3xl mx-auto">
          <button
            onClick={handleLogin}
            className="w-full sm:w-auto min-w-[200px] bg-white hover:bg-gray-50 text-blue-600 font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-100 hover:border-blue-200 transform hover:-translate-y-1"
          >
            Login
          </button>
          
          <button
            onClick={handleSignup}
            className="w-full sm:w-auto min-w-[200px] bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            Sign Up
          </button>
          
          <button
            onClick={handleDashboard}
            className="w-full sm:w-auto min-w-[200px] bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 transform hover:-translate-y-1"
          >
            Go to Dashboard
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="w-64 h-64 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-3xl"></div>
          </div>
          <div className="relative text-sm text-gray-500">
            Start organizing your tasks today
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

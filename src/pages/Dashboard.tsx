import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, Home } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="bg-white/10 backdrop-blur-xl border-b border-white/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">Interview AI</h1>
            <span className="text-white/70">Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-white/70 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button className="text-white/70 hover:text-white transition-colors">
              <User className="w-5 h-5" />
            </button>
            <button 
              onClick={handleLogout}
              className="text-white/70 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl font-bold text-white mb-4">Welcome to your Dashboard!</h2>
          <p className="text-white/70 text-xl">Your AI-powered interview preparation starts here.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dashboard cards would go here */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-semibold text-white mb-3">Recent Interviews</h3>
            <p className="text-white/70">View your recent practice sessions and performance metrics.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-semibold text-white mb-3">AI Analysis</h3>
            <p className="text-white/70">Get detailed feedback on your body language and tone.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-xl font-semibold text-white mb-3">Practice Sessions</h3>
            <p className="text-white/70">Start a new practice interview or continue where you left off.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
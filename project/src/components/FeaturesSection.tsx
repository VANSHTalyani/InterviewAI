import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Mic, Brain, Target, BarChart3, Users } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'Body Language Analysis',
    description: 'AI-powered analysis of your posture, gestures, and facial expressions with real-time feedback.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Mic,
    title: 'Tone & Speech Analysis',
    description: 'Advanced voice analysis to optimize your speaking pace, clarity, and emotional tone.',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    icon: Brain,
    title: 'AI Interview Coaching',
    description: 'Personalized coaching based on your performance patterns and industry-specific requirements.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Target,
    title: 'Personalized Feedback',
    description: 'Detailed insights and actionable recommendations tailored to your specific needs.',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: BarChart3,
    title: 'Performance Tracking',
    description: 'Track your progress over time with comprehensive analytics and performance metrics.',
    color: 'from-red-500 to-pink-500'
  },
  {
    icon: Users,
    title: 'Mock Interviews',
    description: 'Practice with realistic interview scenarios across various industries and roles.',
    color: 'from-indigo-500 to-purple-500'
  }
];

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Powerful Features for
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {' '}Success
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Our AI-powered platform provides comprehensive interview preparation with cutting-edge technology.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} mb-6`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
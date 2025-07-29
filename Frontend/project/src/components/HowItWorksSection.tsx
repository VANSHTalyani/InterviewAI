import React from 'react';
import { motion } from 'framer-motion';
import { Play, Brain, Target, Trophy } from 'lucide-react';

const steps = [
  {
    icon: Play,
    title: 'Start Your Session',
    description: 'Choose your interview type and begin your AI-powered practice session.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Brain,
    title: 'AI Analysis',
    description: 'Our advanced AI analyzes your performance in real-time across multiple dimensions.',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    icon: Target,
    title: 'Get Feedback',
    description: 'Receive detailed insights on body language, tone, and content with actionable recommendations.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Trophy,
    title: 'Achieve Success',
    description: 'Apply your learnings and ace your real interviews with confidence.',
    color: 'from-yellow-500 to-orange-500'
  }
];

const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How It
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {' '}Works
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Our streamlined process makes interview preparation simple and effective.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 via-green-500/20 to-orange-500/20 transform -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.05 }}
                className="relative group"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 text-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-r ${step.color} mb-6 mx-auto`}>
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    
                    <div className="text-sm font-bold text-white/60 mb-2">STEP {index + 1}</div>
                    <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
                    <p className="text-white/70 leading-relaxed">{step.description}</p>
                  </div>
                </div>

                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-20">
                  {index + 1}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
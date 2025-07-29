import React from 'react';
import { motion } from 'framer-motion';

const AuthBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 left-10 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl"
      />
      
      <motion.div
        animate={{
          y: [0, 25, 0],
          rotate: [0, -5, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-60 right-20 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl"
      />
      
      <motion.div
        animate={{
          y: [0, -15, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl"
      />
      
      <motion.div
        animate={{
          y: [0, 30, 0],
          x: [0, -10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-40 right-1/3 w-36 h-36 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-full blur-2xl"
      />
    </div>
  );
};

export default AuthBackground;
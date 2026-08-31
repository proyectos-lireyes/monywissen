import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;
  
  const pieces = Array.from({ length: 30 });
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: colors[i % colors.length] }}
          initial={{ 
            opacity: 1, 
            x: '50%', 
            y: '50%',
            scale: 0
          }}
          animate={{ 
            opacity: 0,
            x: `calc(50% + ${(Math.random() - 0.5) * 300}px)`,
            y: `calc(50% + ${(Math.random() - 0.5) * 300}px)`,
            scale: Math.random() * 1.5 + 0.5,
            rotate: Math.random() * 360
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

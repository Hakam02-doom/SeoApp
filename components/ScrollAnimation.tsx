'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ScrollAnimationProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export default function ScrollAnimation({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: ScrollAnimationProps) {
  const directionVariants = {
    up: { y: 60, opacity: 0, scale: 0.95 },
    down: { y: -60, opacity: 0, scale: 0.95 },
    left: { x: 60, opacity: 0, scale: 0.95 },
    right: { x: -60, opacity: 0, scale: 0.95 },
  };

  return (
    <motion.div
      initial={directionVariants[direction]}
      whileInView={{ 
        y: 0, 
        x: 0, 
        opacity: 1,
        scale: 1
      }}
      viewport={{ 
        once: true, 
        margin: '-50px',
        amount: 0.3
      }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 20,
        mass: 0.8,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

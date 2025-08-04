'use client';

import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = 40, color = '#00cc99' }) {
  return (
    <motion.div
      className="flex items-center justify-center"
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="31.4"
          strokeDashoffset="0"
          animate={{ strokeDashoffset: [0, -31.4] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ fill: 'none' }}
        />
      </svg>
    </motion.div>
  );
}
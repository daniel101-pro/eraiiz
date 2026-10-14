'use client';

import { motion } from 'framer-motion';

export default function CrazyLoader({
  title = 'Working on it',
  subtitle = 'Hang tight',
  fullscreen = false,
}) {
  const body = (
    <div className="relative flex flex-col items-center justify-center px-6 text-center">
      <div className="relative h-32 w-32">
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400 via-lime-300 to-green-700 blur-md"
          animate={{ rotate: 360, scale: [0.85, 1.15, 0.85] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-4 border-dashed border-white/80"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-7 rounded-full bg-green-950"
          animate={{ scale: [1, 0.7, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        />
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <motion.span
            key={index}
            className="absolute left-1/2 top-1/2 h-3 w-3 -ml-1.5 -mt-1.5 rounded-full bg-lime-300 shadow-[0_0_12px_#bbf7d0]"
            animate={{
              x: [0, Math.cos((index / 6) * Math.PI * 2) * 52, 0],
              y: [0, Math.sin((index / 6) * Math.PI * 2) * 52, 0],
              scale: [1, 1.8, 1],
            }}
            transition={{ duration: 0.85, repeat: Infinity, delay: index * 0.08, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <motion.p
        className="mt-8 text-xl font-black uppercase tracking-[0.25em] text-green-950"
        animate={{ opacity: [1, 0.35, 1], y: [0, -6, 0], letterSpacing: ['0.15em', '0.35em', '0.15em'] }}
        transition={{ duration: 0.7, repeat: Infinity }}
      >
        {title}
      </motion.p>
      <motion.p
        className="mt-2 text-sm font-medium text-green-800"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.9, repeat: Infinity }}
      >
        {subtitle}
      </motion.p>
    </div>
  );

  if (!fullscreen) {
    return <div className="py-10">{body}</div>;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,197,94,0.25),_transparent_55%)]"
        animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
      {body}
    </div>
  );
}

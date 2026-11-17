'use client';

import { motion } from 'framer-motion';

export function tierForRank(short) {
  const value = String(short || '').toLowerCase();
  if (value.includes('terra') || value.includes('biosphere')) return 'legendary';
  if (value.includes('watershed')) return 'diamond';
  if (value.includes('canopy')) return 'platinum';
  if (value.includes('grove') || value.includes('bloom')) return 'gold';
  if (value.includes('sprout')) return 'silver';
  return 'bronze';
}

export default function EcoRankBadge({
  rank,
  level = 1,
  size = 'md',
  showLabel = true,
  animate = true,
}) {
  const dims =
    size === 'lg'
      ? 'w-24 h-24 text-2xl'
      : size === 'sm'
        ? 'w-12 h-12 text-sm'
        : 'w-16 h-16 text-lg';

  return (
    <div className="flex items-center gap-3">
      <motion.div
        className={`relative ${dims}`}
        animate={animate ? { scale: [1, 1.02, 1] } : undefined}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex h-full w-full items-center justify-center border border-gray-200 bg-white font-semibold text-green-950">
          {level}
        </div>
      </motion.div>
      {showLabel ? (
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Rank</p>
          <p className="truncate text-sm font-semibold text-green-950">{rank?.title || 'Seed'}</p>
          <p className="text-xs text-gray-500">Level {level}</p>
        </div>
      ) : null}
    </div>
  );
}

export function BadgeMedallion({ badge, compact = false }) {
  const locked = !badge.unlocked;
  const pct = Math.min(100, (Number(badge.progress || 0) / Math.max(1, Number(badge.target || 1))) * 100);

  return (
    <div
      className={`border border-gray-200 bg-white ${compact ? 'p-3' : 'p-4'} ${
        locked ? 'opacity-70' : ''
      }`}
    >
      <div className={`flex ${compact ? 'items-center gap-3' : 'flex-col gap-3'}`}>
        <div
          className={`${
            compact ? 'h-12 w-12 text-xl' : 'h-14 w-14 text-2xl'
          } flex items-center justify-center border border-gray-200 bg-white`}
        >
          <span>{locked ? '—' : badge.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-semibold ${locked ? 'text-gray-500' : 'text-green-950'}`}>
              {badge.name}
            </p>
            <span className="border border-gray-200 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gray-500">
              {badge.tier}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">{badge.description}</p>
          <div className="mt-2 h-1.5 overflow-hidden bg-gray-100">
            <div className="h-full bg-green-950" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-gray-500">
            {badge.progress}/{badge.target}
          </p>
        </div>
      </div>
    </div>
  );
}

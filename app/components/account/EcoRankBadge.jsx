'use client';

import { motion } from 'framer-motion';

const TIER_STYLES = {
  bronze: {
    ring: 'from-amber-700 via-amber-500 to-amber-800',
    glow: 'shadow-[0_0_24px_rgba(180,120,40,0.45)]',
    plate: 'from-[#3b2a1a] to-[#1c140c]',
  },
  silver: {
    ring: 'from-slate-200 via-slate-400 to-slate-500',
    glow: 'shadow-[0_0_24px_rgba(180,190,210,0.4)]',
    plate: 'from-[#2a3038] to-[#12161c]',
  },
  gold: {
    ring: 'from-yellow-300 via-amber-400 to-yellow-600',
    glow: 'shadow-[0_0_28px_rgba(250,190,40,0.5)]',
    plate: 'from-[#3a2d12] to-[#17110a]',
  },
  platinum: {
    ring: 'from-cyan-200 via-slate-100 to-cyan-400',
    glow: 'shadow-[0_0_28px_rgba(120,220,255,0.45)]',
    plate: 'from-[#1a2a32] to-[#0b1218]',
  },
  diamond: {
    ring: 'from-sky-300 via-indigo-300 to-fuchsia-400',
    glow: 'shadow-[0_0_32px_rgba(140,160,255,0.55)]',
    plate: 'from-[#1a1834] to-[#0b0a18]',
  },
  legendary: {
    ring: 'from-fuchsia-400 via-amber-300 to-rose-500',
    glow: 'shadow-[0_0_36px_rgba(255,120,200,0.55)]',
    plate: 'from-[#321028] to-[#120812]',
  },
};

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
  const tier = tierForRank(rank?.short || rank?.title);
  const styles = TIER_STYLES[tier] || TIER_STYLES.bronze;
  const dims =
    size === 'lg'
      ? 'w-28 h-28 text-3xl'
      : size === 'sm'
        ? 'w-12 h-12 text-sm'
        : 'w-16 h-16 text-lg';

  return (
    <div className={`flex items-center gap-3 ${showLabel ? '' : ''}`}>
      <motion.div
        className={`relative ${dims} rounded-full ${styles.glow}`}
        animate={
          animate
            ? {
                rotate: [0, 2, -2, 0],
                scale: [1, 1.03, 1],
              }
            : undefined
        }
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${styles.ring} p-[2px]`}>
          <div
            className={`w-full h-full rounded-full bg-gradient-to-br ${styles.plate} flex items-center justify-center border border-white/10`}
          >
            <span className="font-black tracking-tight text-white drop-shadow">
              {level}
            </span>
          </div>
        </div>
        <motion.div
          className={`absolute -inset-1 rounded-full bg-gradient-to-r ${styles.ring} opacity-30 blur-md`}
          animate={animate ? { opacity: [0.15, 0.4, 0.15] } : undefined}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
      </motion.div>
      {showLabel && (
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Rank</p>
          <p className="text-sm font-semibold text-gray-900 truncate">
            {rank?.title || 'Seed'}
          </p>
          <p className="text-xs text-gray-500">Level {level}</p>
        </div>
      )}
    </div>
  );
}

export function BadgeMedallion({ badge, compact = false }) {
  const styles = TIER_STYLES[badge.tier] || TIER_STYLES.bronze;
  const locked = !badge.unlocked;

  return (
    <motion.div
      whileHover={locked ? undefined : { y: -4, scale: 1.03 }}
      className={`relative overflow-hidden rounded-2xl border ${
        locked ? 'border-gray-200 bg-gray-50 opacity-70' : 'border-white/10'
      } ${compact ? 'p-3' : 'p-4'} ${locked ? '' : styles.glow}`}
      style={
        locked
          ? undefined
          : {
              background:
                badge.tier === 'legendary'
                  ? 'linear-gradient(135deg,#2a1024 0%,#120812 55%,#3a1a10 100%)'
                  : undefined,
            }
      }
    >
      {!locked && (
        <motion.div
          className={`pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12`}
          animate={{ x: ['0%', '280%'] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
        />
      )}
      <div className={`relative z-10 flex ${compact ? 'items-center gap-3' : 'flex-col gap-3'}`}>
        <div
          className={`${compact ? 'h-12 w-12 text-xl' : 'h-16 w-16 text-2xl'} rounded-full bg-gradient-to-br ${styles.ring} p-[2px]`}
        >
          <div
            className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${styles.plate} ${
              locked ? 'grayscale' : ''
            }`}
          >
            <span>{locked ? '🔒' : badge.icon}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`font-semibold text-sm ${locked ? 'text-gray-600' : 'text-white'}`}>
              {badge.name}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                locked ? 'bg-gray-200 text-gray-600' : 'bg-white/10 text-white/90'
              }`}
            >
              {badge.tier}
            </span>
          </div>
          <p className={`mt-1 text-xs ${locked ? 'text-gray-500' : 'text-white/70'}`}>
            {badge.description}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/20">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${styles.ring}`}
              style={{ width: `${Math.min(100, (badge.progress / badge.target) * 100)}%` }}
            />
          </div>
          <p className={`mt-1 text-[10px] ${locked ? 'text-gray-500' : 'text-white/60'}`}>
            {badge.progress}/{badge.target}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

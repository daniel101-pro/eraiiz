'use client';

export function tierForRank(short) {
  const value = String(short || '').toLowerCase();
  if (value.includes('terra') || value.includes('biosphere')) return 'legendary';
  if (value.includes('watershed')) return 'diamond';
  if (value.includes('canopy')) return 'platinum';
  if (value.includes('grove') || value.includes('bloom')) return 'gold';
  if (value.includes('sprout')) return 'silver';
  return 'bronze';
}

const TIER_LABEL = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond',
  legendary: 'Legendary',
};

export default function EcoRankBadge({
  rank,
  level = 1,
  size = 'md',
  showLabel = true,
}) {
  const dims =
    size === 'lg' ? 'h-16 w-16 text-xl' : size === 'sm' ? 'h-10 w-10 text-sm' : 'h-12 w-12 text-base';

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${dims} flex items-center justify-center border border-gray-200 bg-white font-semibold text-green-950`}
      >
        {level}
      </div>
      {showLabel && (
        <div className="min-w-0">
          <p className="text-sm font-medium text-green-950">{rank?.title || 'Seed'}</p>
          <p className="text-xs text-gray-500">Level {level}</p>
        </div>
      )}
    </div>
  );
}

export function BadgeMedallion({ badge }) {
  const locked = !badge.unlocked;
  const pct = Math.min(100, (Number(badge.progress || 0) / Math.max(1, Number(badge.target || 1))) * 100);

  return (
    <div className={`border border-gray-200 p-4 ${locked ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center border border-gray-200 text-lg ${
            locked ? 'bg-white text-gray-400' : 'bg-green-50 text-green-950'
          }`}
        >
          {locked ? '—' : badge.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-medium ${locked ? 'text-gray-600' : 'text-green-950'}`}>
              {badge.name}
            </p>
            <span className="text-xs text-gray-500">{TIER_LABEL[badge.tier] || badge.tier}</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{badge.description}</p>
          <div className="mt-3 h-1.5 bg-gray-100">
            <div className="h-full bg-green-800" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {badge.progress}/{badge.target}
          </p>
        </div>
      </div>
    </div>
  );
}

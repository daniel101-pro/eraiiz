'use client';

export default function EcoRankBadge({
  rank,
  level = 1,
  size = 'md',
  showLabel = true,
}) {
  const dims =
    size === 'lg' ? 'h-14 w-14 text-lg' : size === 'sm' ? 'h-10 w-10 text-sm' : 'h-12 w-12 text-base';

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${dims} flex items-center justify-center border border-gray-200 bg-white font-semibold text-green-950`}
      >
        {level}
      </div>
      {showLabel ? (
        <div className="min-w-0">
          <p className="text-sm font-medium text-green-950">{rank?.title || 'Seed'}</p>
          <p className="text-xs text-gray-500">Level {level}</p>
        </div>
      ) : null}
    </div>
  );
}

export function BadgeRow({ badge }) {
  const locked = !badge.unlocked;
  const pct = Math.min(
    100,
    (Number(badge.progress || 0) / Math.max(1, Number(badge.target || 1))) * 100
  );

  return (
    <div className="border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-sm font-medium ${locked ? 'text-gray-500' : 'text-green-950'}`}>
            {badge.name}
          </p>
          <p className="mt-1 text-sm text-gray-500">{badge.description}</p>
          <p className="mt-2 text-xs text-gray-400">{badge.tier}</p>
        </div>
        <p className="flex-shrink-0 text-sm text-gray-600">
          {badge.progress}/{badge.target}
        </p>
      </div>
      <div className="mt-3 h-1.5 bg-gray-100">
        <div className="h-full bg-green-950" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

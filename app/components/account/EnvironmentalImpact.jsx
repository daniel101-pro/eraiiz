'use client';

import { useEffect, useMemo, useState } from 'react';
import { getValidAccessToken, refreshAccessToken } from '../../utils/auth';
import { buildBadges, buildEcoImpactSummary } from '@/lib/ecoImpact';
import EcoRankBadge, { BadgeRow } from './EcoRankBadge';

const emptyImpact = {
  ...buildEcoImpactSummary([]),
  badges: buildBadges({
    purchaseCount: 0,
    carbonSaved: 0,
    recycledPurchases: 0,
    uniqueCategories: 0,
    lowImpactPurchases: 0,
    level: 1,
  }),
};

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'badges', label: 'Badges' },
  { id: 'details', label: 'Details' },
];

export default function EnvironmentalImpact() {
  const [impactData, setImpactData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      try {
        let token = await getValidAccessToken();
        let res = await fetch('/api/account/environmental-impact', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (res.status === 401) {
          token = await refreshAccessToken();
          res = await fetch('/api/account/environmental-impact', {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          });
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Failed to load impact');
        setImpactData(data);
        try {
          localStorage.setItem('eraiiz_eco_impact', JSON.stringify(data));
          window.dispatchEvent(new CustomEvent('eraiiz:eco-impact-updated', { detail: data }));
        } catch {
          // ignore
        }
      } catch (err) {
        setError(err.message || 'Failed to load impact');
        try {
          const cached = JSON.parse(localStorage.getItem('eraiiz_eco_impact') || 'null');
          const rankTitle = String(cached?.rank?.title || '');
          if (
            cached &&
            !/recruit|operator|vanguard|elite|legend|mythic|eternal guardian/i.test(rankTitle)
          ) {
            setImpactData(cached);
          }
        } catch {
          // ignore
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const data = impactData || emptyImpact;
  const categoryEntries = useMemo(
    () =>
      Object.entries(data.categories || {}).sort(
        (a, b) => Number(b[1].carbonSaved || 0) - Number(a[1].carbonSaved || 0)
      ),
    [data.categories]
  );
  const materialEntries = useMemo(
    () =>
      Object.entries(data.materials || {}).sort(
        (a, b) => Number(b[1].count || 0) - Number(a[1].count || 0)
      ),
    [data.materials]
  );
  const maxMonth = Math.max(1, ...(data.monthlyData || []).map((item) => item.carbonSaved || 0));

  if (isLoading) {
    return (
      <div className="bg-white py-10 text-sm text-gray-500">Loading impact…</div>
    );
  }

  return (
    <div className="bg-white text-green-950">
      <p className="text-sm font-medium text-green-800">Impact</p>
      <h2 className="mt-1 text-3xl font-bold tracking-tight">{data.rank?.title || 'Seed'}</h2>
      <p className="mt-2 max-w-xl text-sm text-gray-600">
        Level {data.level}
        {data.nextRank ? ` · Next rank ${data.nextRank.title}` : ' · Top rank'}
      </p>

      <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <EcoRankBadge rank={data.rank} level={data.level} size="lg" showLabel={false} />
        <div className="w-full max-w-md">
          <div className="mb-2 flex justify-between text-sm text-gray-600">
            <span>
              XP {data.xpIntoLevel}/{data.xpForNextLevel}
            </span>
            <span>{Math.round(data.xpProgress)}%</span>
          </div>
          <div className="h-2 bg-gray-100">
            <div className="h-full bg-green-950" style={{ width: `${data.xpProgress}%` }} />
          </div>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'CO₂ saved', value: `${data.totalCarbonSaved} kg` },
          { label: 'Trees eq.', value: `${data.impactMetrics?.treesPlanted || 0}` },
          { label: 'Car km', value: `${data.impactMetrics?.carRidesSaved || 0} km` },
          { label: 'Purchases', value: `${data.purchaseCount || 0}` },
        ].map((stat) => (
          <div key={stat.label} className="border border-gray-200 p-4">
            <p className="text-lg font-semibold">{stat.value}</p>
            <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border px-4 py-3 text-sm ${
              activeTab === tab.id
                ? 'border-green-900 bg-green-950 text-white'
                : 'border-gray-200 bg-white text-green-950 hover:border-green-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <div className="mt-10 grid gap-12 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold">Progress</h3>
            <p className="mt-1 text-sm text-gray-500">Carbon saved by month</p>
            <div className="mt-6 space-y-4">
              {(data.monthlyData || []).length ? (
                data.monthlyData.map((item) => (
                  <div key={item.month}>
                    <div className="mb-1 flex justify-between text-sm text-gray-600">
                      <span>{item.month}</span>
                      <span>
                        {item.carbonSaved} kg · {item.purchases} buys
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100">
                      <div
                        className="h-full bg-green-950"
                        style={{
                          width: `${Math.max(6, (item.carbonSaved / maxMonth) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-sm text-gray-600">
                    No purchases yet. Buy sustainable products to start tracking impact.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Recent purchases</h3>
            <p className="mt-1 text-sm text-gray-500">Counted toward your rank</p>
            <div className="mt-6 space-y-3">
              {(data.recentOrders || []).length ? (
                data.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border border-gray-200 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{order.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-green-800">+{order.carbonSaved} kg</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No completed purchases yet.</p>
              )}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { label: 'Plastic reduced', value: `${data.impactMetrics?.plasticReduced || 0} kg` },
                { label: 'Waste averted', value: `${data.impactMetrics?.wasteAverted || 0} kg` },
                { label: 'Eco rate', value: `${data.ecoFriendlyPercentage || 0}%` },
                {
                  label: 'Badges unlocked',
                  value: `${(data.unlockedBadges || []).length}/${(data.badges || []).length || 0}`,
                },
              ].map((card) => (
                <div key={card.label} className="border border-gray-200 p-4">
                  <p className="text-base font-semibold">{card.value}</p>
                  <p className="mt-1 text-sm text-gray-500">{card.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'badges' ? (
        <div className="mt-10">
          <h3 className="text-lg font-semibold">Badges</h3>
          <p className="mt-1 text-sm text-gray-500">
            {(data.unlockedBadges || []).length} unlocked
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {(data.badges || []).map((badge) => (
              <BadgeRow key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === 'details' ? (
        <div className="mt-10 grid gap-12 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold">By category</h3>
            <div className="mt-6 space-y-4">
              {categoryEntries.length ? (
                categoryEntries.map(([label, value]) => {
                  const max = Math.max(...categoryEntries.map((entry) => entry[1].carbonSaved));
                  return (
                    <div key={label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{label}</span>
                        <span className="text-gray-500">
                          {Number(value.carbonSaved).toFixed(1)} kg · {value.count}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100">
                        <div
                          className="h-full bg-green-950"
                          style={{ width: `${Math.max(6, (value.carbonSaved / max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">No category data yet.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">By material</h3>
            <div className="mt-6 space-y-4">
              {materialEntries.length ? (
                materialEntries.map(([label, value]) => {
                  const max = Math.max(...materialEntries.map((entry) => entry[1].count));
                  return (
                    <div key={label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium capitalize">{label}</span>
                        <span className="text-gray-500">
                          {value.count} items · {Number(value.carbonSaved).toFixed(1)} kg
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100">
                        <div
                          className="h-full bg-green-950"
                          style={{ width: `${Math.max(6, (value.count / max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">No material data yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

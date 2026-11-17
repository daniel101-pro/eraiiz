'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  TreePine,
  Car,
  Recycle,
  Trophy,
  Target,
  Sparkles,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { getValidAccessToken, refreshAccessToken } from '../../utils/auth';
import { buildBadges, buildEcoImpactSummary } from '@/lib/ecoImpact';
import EcoRankBadge, { BadgeMedallion, tierForRank } from './EcoRankBadge';

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

export default function EnvironmentalImpact({ compactHeader = false } = {}) {
  const [impactData, setImpactData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('command');

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
          if (cached) setImpactData(cached);
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
  const tier = tierForRank(data.rank?.short || data.impactLevel);
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
      <div className="flex items-center justify-center rounded-2xl border border-gray-200 p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-green-950 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5 text-green-950">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-200 p-5 md:p-7"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <EcoRankBadge rank={data.rank} level={data.level} size="lg" showLabel={false} />
            <div>
              <p className="text-sm font-medium text-green-800">Impact</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                {data.rank?.title || 'Seed'}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Level {data.level}
                {data.nextRank ? ` · Next rank ${data.nextRank.title}` : ' · Top rank'}
              </p>
              <div className="mt-4 w-full max-w-md">
                <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    XP {data.xpIntoLevel}/{data.xpForNextLevel}
                  </span>
                  <span>{Math.round(data.xpProgress)}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <motion.div
                    className="h-full rounded-full bg-green-950"
                    initial={{ width: 0 }}
                    animate={{ width: `${data.xpProgress}%` }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[420px]">
            {[
              { label: 'CO₂ saved', value: `${data.totalCarbonSaved}`, unit: 'kg', icon: Leaf },
              {
                label: 'Trees eq.',
                value: `${data.impactMetrics?.treesPlanted || 0}`,
                unit: '',
                icon: TreePine,
              },
              {
                label: 'Car km',
                value: `${data.impactMetrics?.carRidesSaved || 0}`,
                unit: 'km',
                icon: Car,
              },
              {
                label: 'Purchases',
                value: `${data.purchaseCount || 0}`,
                unit: '',
                icon: Recycle,
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-200 p-3">
                <stat.icon className="mb-2 h-4 w-4 text-green-800" />
                <p className="text-lg font-bold text-green-950">
                  {stat.value}
                  {stat.unit ? (
                    <span className="ml-1 text-xs font-normal text-gray-500">{stat.unit}</span>
                  ) : null}
                </p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {error ? (
          <p className="mt-4 text-xs text-red-700">
            Live sync issue: {error}. Showing best available impact data.
          </p>
        ) : null}
      </motion.section>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'command', label: 'Overview', icon: Shield },
          { id: 'armory', label: 'Badges', icon: Trophy },
          { id: 'intel', label: 'Details', icon: Target },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'border-green-900 bg-green-950 text-white'
                : 'border-gray-200 text-green-950 hover:border-green-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'command' ? (
          <motion.div
            key="command"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-200 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-green-950">Progress</h3>
                    <p className="text-sm text-gray-500">
                      {data.purchaseCount
                        ? 'Your purchases are counting toward rank'
                        : 'No purchases yet — badges stay locked until your first buy'}
                    </p>
                  </div>
                  <Sparkles className="h-5 w-5 text-green-800" />
                </div>

                {(data.monthlyData || []).length ? (
                  <div className="space-y-4">
                    {data.monthlyData.map((item) => (
                      <div key={item.month}>
                        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                          <span>{item.month}</span>
                          <span>
                            {item.carbonSaved} kg · {item.purchases} buys
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                          <motion.div
                            className="h-full rounded-full bg-green-950"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.max(8, (item.carbonSaved / maxMonth) * 100)}%`,
                            }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                    <p className="text-sm font-medium text-green-950">Waiting on first purchase</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Buy sustainable products to start tracking XP and ranks.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <h3 className="mb-3 text-base font-semibold text-green-950">Recent purchases</h3>
                {(data.recentOrders || []).length ? (
                  <div className="space-y-3">
                    {data.recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-green-950">{order.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-green-800">
                          +{order.carbonSaved} kg
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No completed purchases yet.</p>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-200 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-green-800" />
                  <h3 className="text-base font-semibold text-green-950">Featured badges</h3>
                </div>
                <div className="space-y-3">
                  {(data.badges || [])
                    .slice()
                    .sort((a, b) => Number(b.unlocked) - Number(a.unlocked))
                    .slice(0, 4)
                    .map((badge) => (
                      <BadgeMedallion key={badge.id} badge={badge} compact />
                    ))}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('armory')}
                  className="mt-4 inline-flex items-center gap-1 text-sm text-green-800 hover:text-green-950"
                >
                  View all badges <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: 'Plastic reduced',
                    value: `${data.impactMetrics?.plasticReduced || 0} kg`,
                  },
                  {
                    label: 'Waste averted',
                    value: `${data.impactMetrics?.wasteAverted || 0} kg`,
                  },
                  {
                    label: 'Eco rate',
                    value: `${data.ecoFriendlyPercentage || 0}%`,
                  },
                  {
                    label: 'Unlocked',
                    value: `${(data.unlockedBadges || []).length}/${(data.badges || []).length || 0}`,
                  },
                ].map((card) => (
                  <div key={card.label} className="rounded-2xl border border-gray-200 p-4">
                    <p className="text-lg font-bold text-green-950">{card.value}</p>
                    <p className="text-xs text-gray-500">{card.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}

        {activeTab === 'armory' ? (
          <motion.div
            key="armory"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-gray-200 p-5"
          >
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-950">Badges</h3>
                <p className="text-sm text-gray-500">
                  Bronze to legendary — unlock by shopping sustainable and ranking up
                </p>
              </div>
              <p className="text-sm text-gray-600">
                {(data.unlockedBadges || []).length} unlocked · {tier}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {(data.badges || []).map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <BadgeMedallion badge={badge} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : null}

        {activeTab === 'intel' ? (
          <motion.div
            key="intel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid gap-5 lg:grid-cols-2"
          >
            <div className="rounded-2xl border border-gray-200 p-5">
              <h3 className="mb-4 text-base font-semibold text-green-950">Impact by category</h3>
              {categoryEntries.length ? (
                <div className="space-y-3">
                  {categoryEntries.map(([label, value]) => {
                    const max = Math.max(...categoryEntries.map((entry) => entry[1].carbonSaved));
                    return (
                      <div key={label}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-medium text-green-950">{label}</span>
                          <span className="text-gray-500">
                            {Number(value.carbonSaved).toFixed(1)} kg · {value.count}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-green-950"
                            style={{
                              width: `${Math.max(6, (value.carbonSaved / max) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No category data available yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 p-5">
              <h3 className="mb-4 text-base font-semibold text-green-950">Material impact</h3>
              {materialEntries.length ? (
                <div className="space-y-3">
                  {materialEntries.map(([label, value]) => {
                    const max = Math.max(...materialEntries.map((entry) => entry[1].count));
                    return (
                      <div key={label}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-medium capitalize text-green-950">{label}</span>
                          <span className="text-gray-500">
                            {value.count} items · {Number(value.carbonSaved).toFixed(1)} kg
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-green-950"
                            style={{
                              width: `${Math.max(6, (value.count / max) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No material data available yet.</p>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!compactHeader ? (
        <p className="text-center text-xs text-gray-400">
          XP and ranks update from real orders and product carbon savings.
        </p>
      ) : null}
    </div>
  );
}

'use client'

import { useEffect, useState } from 'react'
import { Globe, Wifi, WifiOff, MessageSquare, Activity, AlertCircle } from 'lucide-react'
import { MetricsCard } from '@/components/MetricsCard'
import { StatusBadge } from '@/components/StatusBadge'
import { getMetrics, getAuditLog, type GatewayMetrics, type AuditEntry } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

function WorldMapPlaceholder() {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-200">Site Distribution</h2>
        <span className="text-xs text-slate-500">World map</span>
      </div>
      <div className="relative h-52 bg-slate-900/60 rounded-md overflow-hidden flex items-center justify-center border border-slate-700/50">
        {/* Simplified world map SVG outline */}
        <svg
          viewBox="0 0 800 400"
          className="w-full h-full opacity-20"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="0.5"
        >
          {/* North America */}
          <path d="M80 80 L160 60 L200 100 L220 160 L180 200 L120 180 L80 140 Z" />
          {/* South America */}
          <path d="M160 220 L200 210 L220 280 L200 340 L160 340 L140 280 Z" />
          {/* Europe */}
          <path d="M340 60 L400 50 L420 100 L380 120 L340 100 Z" />
          {/* Africa */}
          <path d="M340 130 L400 120 L420 200 L400 300 L360 310 L330 240 L320 160 Z" />
          {/* Asia */}
          <path d="M420 50 L620 40 L660 100 L640 160 L560 180 L480 160 L440 120 Z" />
          {/* Australia */}
          <path d="M580 240 L660 230 L680 290 L640 310 L580 290 Z" />
        </svg>

        {/* Site dots */}
        <div className="absolute inset-0">
          {/* US East */}
          <div className="absolute" style={{ left: '18%', top: '35%' }}>
            <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20 animate-pulse" />
          </div>
          {/* US West */}
          <div className="absolute" style={{ left: '10%', top: '32%' }}>
            <div className="w-2 h-2 rounded-full bg-blue-400" />
          </div>
          {/* Europe */}
          <div className="absolute" style={{ left: '45%', top: '22%' }}>
            <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" />
          </div>
          {/* Asia Pacific */}
          <div className="absolute" style={{ left: '75%', top: '40%' }}>
            <div className="w-2 h-2 rounded-full bg-blue-400" />
          </div>
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Active
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Connected
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-500" /> Inactive
          </span>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<GatewayMetrics | null>(null)
  const [activity, setActivity] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [m, log] = await Promise.all([
          getMetrics(),
          getAuditLog({ limit: 10 }),
        ])
        setMetrics(m)
        setActivity(log.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">Cloud Gateway overview</p>
        </div>
        {!loading && !error && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          label="Total Sites"
          value={metrics?.total_sites ?? 0}
          icon={Globe}
          iconColor="text-blue-400"
          subLabel="Registered installations"
          loading={loading}
        />
        <MetricsCard
          label="Active Sites"
          value={metrics?.active_sites ?? 0}
          icon={Activity}
          iconColor="text-emerald-400"
          subLabel="Currently active"
          trend={
            metrics
              ? {
                  direction: 'up',
                  value: `${metrics.active_sites}/${metrics.total_sites}`,
                  label: 'activated',
                }
              : undefined
          }
          loading={loading}
        />
        <MetricsCard
          label="Connected"
          value={metrics?.connected_sites ?? 0}
          icon={Wifi}
          iconColor="text-cyan-400"
          subLabel="Live connections"
          loading={loading}
        />
        <MetricsCard
          label="Messages / hr"
          value={
            metrics
              ? metrics.messages_per_hour >= 1000
                ? `${(metrics.messages_per_hour / 1000).toFixed(1)}k`
                : metrics.messages_per_hour
              : 0
          }
          icon={MessageSquare}
          iconColor="text-violet-400"
          subLabel="Across all sites"
          loading={loading}
        />
      </div>

      {/* Map + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <WorldMapPlaceholder />
        </div>

        {/* Recent Activity */}
        <div className="xl:col-span-2 bg-slate-800/50 border border-slate-700 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Recent Activity</h2>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-700 rounded animate-pulse" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <WifiOff className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-slate-700/50">
              {activity.map((entry) => (
                <div key={entry.id} className="py-2.5 flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">
                      {entry.action}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {entry.actor}
                      {entry.site_slug ? ` · ${entry.site_slug}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Region breakdown */}
      {metrics && metrics.regions && Object.keys(metrics.regions).length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Sites by Region</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(metrics.regions).map(([region, count]) => (
              <div key={region} className="bg-slate-900/50 rounded-md px-3 py-2.5">
                <p className="text-lg font-bold text-white tabular-nums">{count}</p>
                <p className="text-xs text-slate-400 mt-0.5">{region}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

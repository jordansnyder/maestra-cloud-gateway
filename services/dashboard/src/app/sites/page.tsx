'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, RefreshCw, AlertCircle, Search, Globe } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import {
  getSites,
  activateSite,
  suspendSite,
  revokeSite,
  type Site,
  type SiteStatus,
} from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

const STATUS_FILTERS: { label: string; value: SiteStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Revoked', value: 'revoked' },
]

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<SiteStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchSites = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getSites({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 100,
      })
      setSites(res.items)
      setTotal(res.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sites')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchSites()
  }, [fetchSites])

  const handleAction = async (
    siteId: string,
    action: 'activate' | 'suspend' | 'revoke'
  ) => {
    setActionLoading(siteId)
    try {
      if (action === 'activate') await activateSite(siteId)
      else if (action === 'suspend') await suspendSite(siteId)
      else await revokeSite(siteId)
      await fetchSites()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} site`)
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = sites.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      s.region.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Sites</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {total} registered installation{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchSites} className="btn-secondary flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button className="btn-primary flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add Site
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search sites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-8 w-56"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-md p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="space-y-0 divide-y divide-slate-700/50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 px-4 flex items-center gap-4">
                <div className="h-4 w-40 bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-20 bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Globe className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No sites found</p>
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Region</th>
                <th>Status</th>
                <th>Last Heartbeat</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((site) => (
                <tr key={site.id}>
                  <td>
                    <div className="font-medium text-slate-200">{site.name}</div>
                    {site.description && (
                      <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                        {site.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <code className="text-xs bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-300">
                      {site.slug}
                    </code>
                  </td>
                  <td className="text-slate-400">{site.region}</td>
                  <td>
                    <StatusBadge status={site.status} />
                  </td>
                  <td className="text-slate-400 text-xs">
                    {site.last_heartbeat
                      ? formatDistanceToNow(new Date(site.last_heartbeat), { addSuffix: true })
                      : '—'}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      {site.status !== 'active' && site.status !== 'revoked' && (
                        <button
                          onClick={() => handleAction(site.id, 'activate')}
                          disabled={actionLoading === site.id}
                          className="btn-ghost text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                        >
                          Activate
                        </button>
                      )}
                      {site.status === 'active' && (
                        <button
                          onClick={() => handleAction(site.id, 'suspend')}
                          disabled={actionLoading === site.id}
                          className="btn-ghost text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                        >
                          Suspend
                        </button>
                      )}
                      {site.status !== 'revoked' && (
                        <button
                          onClick={() => handleAction(site.id, 'revoke')}
                          disabled={actionLoading === site.id}
                          className="btn-danger"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

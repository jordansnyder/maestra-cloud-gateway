'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, AlertCircle, ClipboardList, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAuditLog, type AuditEntry } from '@/lib/api'
import { format, formatDistanceToNow } from 'date-fns'

const PAGE_SIZE = 50

const ACTION_COLORS: Record<string, string> = {
  site_created: 'text-blue-400',
  site_activated: 'text-emerald-400',
  site_suspended: 'text-orange-400',
  site_revoked: 'text-red-400',
  policy_created: 'text-blue-400',
  policy_updated: 'text-yellow-400',
  policy_deleted: 'text-red-400',
  cert_issued: 'text-emerald-400',
  cert_rotated: 'text-cyan-400',
  cert_revoked: 'text-red-400',
  site_connected: 'text-emerald-400',
  site_disconnected: 'text-slate-400',
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [siteFilter, setSiteFilter] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)

  const fetchLog = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getAuditLog({
        action: actionFilter || undefined,
        site_id: siteFilter || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      setEntries(res.items)
      setTotal(res.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter, siteFilter])

  useEffect(() => {
    fetchLog()
  }, [fetchLog])

  const filtered = search
    ? entries.filter(
        (e) =>
          e.action.toLowerCase().includes(search.toLowerCase()) ||
          e.actor.toLowerCase().includes(search.toLowerCase()) ||
          (e.site_slug ?? '').toLowerCase().includes(search.toLowerCase()) ||
          e.resource_type.toLowerCase().includes(search.toLowerCase())
      )
    : entries

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Audit Log</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {total.toLocaleString()} event{total !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button onClick={fetchLog} className="btn-secondary flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
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
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-8 w-56"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter by action..."
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(0) }}
            className="input-base pl-8 w-44"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter by site..."
            value={siteFilter}
            onChange={(e) => { setSiteFilter(e.target.value); setPage(0) }}
            className="input-base pl-8 w-40"
          />
        </div>
      </div>

      {/* Main layout: table + detail */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Table */}
        <div className="xl:col-span-2 bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="divide-y divide-slate-700/50">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 px-4 flex items-center gap-4">
                  <div className="h-3 w-32 bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-slate-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No audit entries found</p>
            </div>
          ) : (
            <>
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Site</th>
                    <th>Resource</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="cursor-pointer"
                    >
                      <td>
                        <div className="text-xs text-slate-400" title={entry.timestamp}>
                          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`text-xs font-mono font-medium ${ACTION_COLORS[entry.action] ?? 'text-slate-300'}`}
                        >
                          {entry.action}
                        </span>
                      </td>
                      <td className="text-slate-400 text-xs">{entry.actor}</td>
                      <td>
                        {entry.site_slug ? (
                          <code className="text-xs bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-300">
                            {entry.site_slug}
                          </code>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                      <td className="text-slate-500 text-xs">{entry.resource_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Page {page + 1} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="btn-secondary p-1.5 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="btn-secondary p-1.5 disabled:opacity-40"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-700">
            <span className="text-xs font-medium text-slate-400">Entry Detail</span>
          </div>
          {selectedEntry ? (
            <div className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-slate-500 mb-1">Action</p>
                  <span className={`font-mono font-medium ${ACTION_COLORS[selectedEntry.action] ?? 'text-slate-300'}`}>
                    {selectedEntry.action}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Actor</p>
                  <span className="text-slate-300">{selectedEntry.actor}</span>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Timestamp</p>
                  <span className="text-slate-300">
                    {format(new Date(selectedEntry.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </span>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Resource</p>
                  <span className="text-slate-300">{selectedEntry.resource_type}</span>
                </div>
                {selectedEntry.site_slug && (
                  <div>
                    <p className="text-slate-500 mb-1">Site</p>
                    <code className="bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-300">
                      {selectedEntry.site_slug}
                    </code>
                  </div>
                )}
                {selectedEntry.resource_id && (
                  <div>
                    <p className="text-slate-500 mb-1">Resource ID</p>
                    <code className="text-slate-500 break-all">{selectedEntry.resource_id}</code>
                  </div>
                )}
                {selectedEntry.ip_address && (
                  <div>
                    <p className="text-slate-500 mb-1">IP Address</p>
                    <span className="text-slate-300 font-mono">{selectedEntry.ip_address}</span>
                  </div>
                )}
              </div>
              {selectedEntry.details && Object.keys(selectedEntry.details).length > 0 && (
                <div>
                  <p className="text-slate-500 mb-1">Details</p>
                  <pre className="font-mono text-slate-300 bg-slate-900/60 rounded p-3 overflow-x-auto whitespace-pre-wrap break-all text-xs">
                    {JSON.stringify(selectedEntry.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
              Select an entry to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

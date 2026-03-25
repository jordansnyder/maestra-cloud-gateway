'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, RefreshCw, AlertCircle, ShieldCheck, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import {
  getPolicies,
  togglePolicy,
  deletePolicy,
  type Policy,
  type PolicyAction,
} from '@/lib/api'

const ACTION_COLORS: Record<PolicyAction, string> = {
  allow: 'text-emerald-400',
  deny: 'text-red-400',
  rate_limit: 'text-yellow-400',
  transform: 'text-blue-400',
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchPolicies = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getPolicies({ limit: 100 })
      setPolicies(res.items)
      setTotal(res.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policies')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPolicies()
  }, [fetchPolicies])

  const handleToggle = async (policy: Policy) => {
    setToggling(policy.id)
    try {
      const updated = await togglePolicy(policy.id, !policy.enabled)
      setPolicies((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle policy')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (policyId: string) => {
    if (!confirm('Delete this policy? This cannot be undone.')) return
    setDeleting(policyId)
    try {
      await deletePolicy(policyId)
      setPolicies((prev) => prev.filter((p) => p.id !== policyId))
      setTotal((t) => t - 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete policy')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Policies</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {total} routing rule{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPolicies} className="btn-secondary flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button className="btn-primary flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add Policy
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

      {/* Info note */}
      <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 text-xs text-blue-300">
        <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Policies are evaluated in priority order (lower number = higher priority). Higher-priority policies take precedence when patterns overlap.
        </span>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="space-y-0 divide-y divide-slate-700/50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 px-4 flex items-center gap-4">
                <div className="h-4 w-40 bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-32 bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : policies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <ShieldCheck className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No policies configured</p>
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Name</th>
                <th>Site</th>
                <th>Direction</th>
                <th>Subject Pattern</th>
                <th>Action</th>
                <th>Enabled</th>
                <th className="text-right">Delete</th>
              </tr>
            </thead>
            <tbody>
              {policies
                .slice()
                .sort((a, b) => a.priority - b.priority)
                .map((policy) => (
                  <tr key={policy.id}>
                    <td>
                      <span className="text-slate-400 font-mono text-xs">{policy.priority}</span>
                    </td>
                    <td>
                      <span className="font-medium text-slate-200">{policy.name}</span>
                    </td>
                    <td>
                      {policy.site_slug ? (
                        <code className="text-xs bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-300">
                          {policy.site_slug}
                        </code>
                      ) : (
                        <span className="text-xs text-slate-500 italic">global</span>
                      )}
                    </td>
                    <td>
                      <span className="text-xs text-slate-400 capitalize">{policy.direction}</span>
                    </td>
                    <td>
                      <code className="text-xs font-mono text-slate-300 bg-slate-700/40 px-1.5 py-0.5 rounded max-w-xs truncate block">
                        {policy.subject_pattern}
                      </code>
                    </td>
                    <td>
                      <span
                        className={`text-xs font-semibold uppercase ${ACTION_COLORS[policy.action] ?? 'text-slate-400'}`}
                      >
                        {policy.action}
                      </span>
                    </td>
                    <td>
                      {/* Toggle switch */}
                      <button
                        onClick={() => handleToggle(policy)}
                        disabled={toggling === policy.id}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                          policy.enabled ? 'bg-blue-600' : 'bg-slate-600'
                        } ${toggling === policy.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out mt-0.5 ${
                            policy.enabled ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleDelete(policy.id)}
                          disabled={deleting === policy.id}
                          className="btn-danger p-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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

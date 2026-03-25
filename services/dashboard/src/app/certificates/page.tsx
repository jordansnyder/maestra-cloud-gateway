'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, RefreshCw, AlertCircle, KeyRound, RotateCcw, ShieldOff } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import {
  getCertificates,
  rotateCert,
  revokeCert,
  type Certificate,
} from '@/lib/api'
import { formatDistanceToNow, isPast, isWithinInterval, addDays } from 'date-fns'

function expiryStatus(expiresAt: string): { label: string; color: string } {
  const exp = new Date(expiresAt)
  if (isPast(exp)) return { label: 'Expired', color: 'text-red-400' }
  if (isWithinInterval(new Date(), { start: new Date(), end: addDays(exp, -30) })) {
    // more than 30 days left - but we're checking the reverse: if now is before exp-30days, that means we have > 30 days
    return { label: formatDistanceToNow(exp, { addSuffix: true }), color: 'text-slate-400' }
  }
  return { label: formatDistanceToNow(exp, { addSuffix: true }), color: 'text-yellow-400' }
}

export default function CertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchCerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getCertificates({ limit: 100 })
      setCerts(res.items)
      setTotal(res.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load certificates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCerts()
  }, [fetchCerts])

  const handleRotate = async (certId: string) => {
    setActionLoading(certId)
    try {
      const updated = await rotateCert(certId)
      setCerts((prev) => prev.map((c) => (c.id === certId ? updated : c)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate certificate')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRevoke = async (certId: string) => {
    if (!confirm('Revoke this certificate? The site will lose access immediately.')) return
    setActionLoading(certId)
    try {
      await revokeCert(certId)
      await fetchCerts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke certificate')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Certificates</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {total} certificate{total !== 1 ? 's' : ''} issued
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCerts} className="btn-secondary flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button className="btn-primary flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Issue Certificate
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

      {/* Summary cards */}
      {!loading && certs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {(['valid', 'expired', 'revoked'] as const).map((status) => {
            const count = certs.filter((c) => c.status === status).length
            return (
              <div
                key={status}
                className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 flex items-center gap-3"
              >
                <StatusBadge status={status} />
                <span className="text-lg font-bold text-white tabular-nums">{count}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-700/50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 px-4 flex items-center gap-4">
                <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-48 bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-32 bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : certs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <KeyRound className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No certificates issued</p>
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Site</th>
                <th>Common Name</th>
                <th>Serial</th>
                <th>Issued</th>
                <th>Expires</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certs.map((cert) => {
                const expiry = expiryStatus(cert.expires_at)
                return (
                  <tr key={cert.id}>
                    <td>
                      {cert.site_slug ? (
                        <code className="text-xs bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-300">
                          {cert.site_slug}
                        </code>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td>
                      <span className="font-medium text-slate-200 text-xs font-mono">
                        {cert.common_name}
                      </span>
                    </td>
                    <td>
                      <code className="text-xs font-mono text-slate-500 truncate block max-w-32" title={cert.serial}>
                        {cert.serial.slice(0, 16)}…
                      </code>
                    </td>
                    <td className="text-slate-400 text-xs">
                      {formatDistanceToNow(new Date(cert.issued_at), { addSuffix: true })}
                    </td>
                    <td>
                      <span className={`text-xs ${expiry.color}`}>{expiry.label}</span>
                    </td>
                    <td>
                      <StatusBadge status={cert.status} />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        {cert.status === 'valid' && (
                          <button
                            onClick={() => handleRotate(cert.id)}
                            disabled={actionLoading === cert.id}
                            className="btn-ghost flex items-center gap-1"
                            title="Rotate certificate"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Rotate
                          </button>
                        )}
                        {cert.status !== 'revoked' && (
                          <button
                            onClick={() => handleRevoke(cert.id)}
                            disabled={actionLoading === cert.id}
                            className="btn-danger flex items-center gap-1"
                            title="Revoke certificate"
                          >
                            <ShieldOff className="w-3 h-3" />
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

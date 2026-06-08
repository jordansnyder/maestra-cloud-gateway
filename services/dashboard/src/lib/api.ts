const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8090'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SiteStatus = 'active' | 'pending' | 'suspended' | 'revoked'
export type PolicyAction = 'allow' | 'deny' | 'rate_limit' | 'transform'
export type PolicyDirection = 'inbound' | 'outbound' | 'both'
export type CertStatus = 'valid' | 'expired' | 'revoked'
export type StreamType = 'nats' | 'mqtt' | 'osc' | 'websocket'

export interface Site {
  id: string
  name: string
  slug: string
  region: string
  status: SiteStatus
  description?: string
  last_heartbeat?: string
  connected_at?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown>
}

export interface SiteCreate {
  name: string
  slug: string
  region: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface SiteStatus2 {
  site_id: string
  slug: string
  status: SiteStatus
  connected: boolean
  last_heartbeat?: string
  messages_per_hour: number
  active_connections: number
}

export interface Policy {
  id: string
  name: string
  site_id?: string
  site_slug?: string
  direction: PolicyDirection
  subject_pattern: string
  action: PolicyAction
  enabled: boolean
  priority: number
  config?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PolicyCreate {
  name: string
  site_id?: string
  direction: PolicyDirection
  subject_pattern: string
  action: PolicyAction
  enabled?: boolean
  priority?: number
  config?: Record<string, unknown>
}

export interface Certificate {
  id: string
  site_id: string
  site_slug?: string
  common_name: string
  serial: string
  issued_at: string
  expires_at: string
  status: CertStatus
  fingerprint?: string
}

export interface CertificateIssue {
  site_id: string
  common_name: string
  ttl_days?: number
}

export interface GatewayMetrics {
  total_sites: number
  active_sites: number
  connected_sites: number
  messages_per_hour: number
  messages_per_minute: number
  total_messages_today: number
  active_connections: number
  uptime_seconds: number
  regions: Record<string, number>
}

export interface AuditEntry {
  id: string
  timestamp: string
  action: string
  actor: string
  site_id?: string
  site_slug?: string
  resource_type: string
  resource_id?: string
  details?: Record<string, unknown>
  ip_address?: string
}

export interface AuditLogParams {
  site_id?: string
  action?: string
  actor?: string
  since?: string
  until?: string
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new Error(`API error ${res.status}: ${text}`)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ─── Sites ────────────────────────────────────────────────────────────────────

export async function getSites(params?: {
  status?: SiteStatus
  region?: string
  limit?: number
  offset?: number
}): Promise<PaginatedResponse<Site>> {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.region) qs.set('region', params.region)
  if (params?.limit != null) qs.set('limit', String(params.limit))
  if (params?.offset != null) qs.set('offset', String(params.offset))
  const query = qs.toString() ? `?${qs}` : ''
  return request<PaginatedResponse<Site>>(`/api/v1/sites${query}`)
}

export async function getSite(siteId: string): Promise<Site> {
  return request<Site>(`/api/v1/sites/${siteId}`)
}

export async function createSite(data: SiteCreate): Promise<Site> {
  return request<Site>('/api/v1/sites', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateSite(siteId: string, data: Partial<SiteCreate>): Promise<Site> {
  return request<Site>(`/api/v1/sites/${siteId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function activateSite(siteId: string): Promise<Site> {
  return request<Site>(`/api/v1/sites/${siteId}/activate`, { method: 'POST' })
}

export async function suspendSite(siteId: string): Promise<Site> {
  return request<Site>(`/api/v1/sites/${siteId}/suspend`, { method: 'POST' })
}

export async function revokeSite(siteId: string): Promise<Site> {
  return request<Site>(`/api/v1/sites/${siteId}/revoke`, { method: 'POST' })
}

export async function getSiteStatus(siteId: string): Promise<SiteStatus2> {
  return request<SiteStatus2>(`/api/v1/sites/${siteId}/status`)
}

// ─── Policies ─────────────────────────────────────────────────────────────────

export async function getPolicies(params?: {
  site_id?: string
  action?: PolicyAction
  enabled?: boolean
  limit?: number
  offset?: number
}): Promise<PaginatedResponse<Policy>> {
  const qs = new URLSearchParams()
  if (params?.site_id) qs.set('site_id', params.site_id)
  if (params?.action) qs.set('action', params.action)
  if (params?.enabled != null) qs.set('enabled', String(params.enabled))
  if (params?.limit != null) qs.set('limit', String(params.limit))
  if (params?.offset != null) qs.set('offset', String(params.offset))
  const query = qs.toString() ? `?${qs}` : ''
  return request<PaginatedResponse<Policy>>(`/api/v1/policies${query}`)
}

export async function getPolicy(policyId: string): Promise<Policy> {
  return request<Policy>(`/api/v1/policies/${policyId}`)
}

export async function createPolicy(data: PolicyCreate): Promise<Policy> {
  return request<Policy>('/api/v1/policies', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updatePolicy(policyId: string, data: Partial<PolicyCreate>): Promise<Policy> {
  return request<Policy>(`/api/v1/policies/${policyId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deletePolicy(policyId: string): Promise<void> {
  return request<void>(`/api/v1/policies/${policyId}`, { method: 'DELETE' })
}

export async function togglePolicy(policyId: string, enabled: boolean): Promise<Policy> {
  return request<Policy>(`/api/v1/policies/${policyId}`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  })
}

// ─── Certificates ─────────────────────────────────────────────────────────────

export async function getCertificates(params?: {
  site_id?: string
  status?: CertStatus
  limit?: number
  offset?: number
}): Promise<PaginatedResponse<Certificate>> {
  const qs = new URLSearchParams()
  if (params?.site_id) qs.set('site_id', params.site_id)
  if (params?.status) qs.set('status', params.status)
  if (params?.limit != null) qs.set('limit', String(params.limit))
  if (params?.offset != null) qs.set('offset', String(params.offset))
  const query = qs.toString() ? `?${qs}` : ''
  return request<PaginatedResponse<Certificate>>(`/api/v1/certificates${query}`)
}

export async function issueCert(data: CertificateIssue): Promise<Certificate> {
  return request<Certificate>('/api/v1/certificates', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function rotateCert(certId: string): Promise<Certificate> {
  return request<Certificate>(`/api/v1/certificates/${certId}/rotate`, { method: 'POST' })
}

export async function revokeCert(certId: string): Promise<void> {
  return request<void>(`/api/v1/certificates/${certId}/revoke`, { method: 'POST' })
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export async function getMetrics(): Promise<GatewayMetrics> {
  return request<GatewayMetrics>('/api/v1/metrics')
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export async function getAuditLog(
  params?: AuditLogParams
): Promise<PaginatedResponse<AuditEntry>> {
  const qs = new URLSearchParams()
  if (params?.site_id) qs.set('site_id', params.site_id)
  if (params?.action) qs.set('action', params.action)
  if (params?.actor) qs.set('actor', params.actor)
  if (params?.since) qs.set('since', params.since)
  if (params?.until) qs.set('until', params.until)
  if (params?.limit != null) qs.set('limit', String(params.limit))
  if (params?.offset != null) qs.set('offset', String(params.offset))
  const query = qs.toString() ? `?${qs}` : ''
  return request<PaginatedResponse<AuditEntry>>(`/api/v1/audit${query}`)
}

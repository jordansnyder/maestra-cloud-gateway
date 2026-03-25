import clsx from 'clsx'

export type StatusVariant =
  | 'active'
  | 'pending'
  | 'suspended'
  | 'revoked'
  | 'connected'
  | 'disconnected'
  | 'expired'
  | 'valid'
  | 'enabled'
  | 'disabled'

interface StatusBadgeProps {
  status: StatusVariant | string
  size?: 'sm' | 'md'
  dot?: boolean
}

const statusConfig: Record<string, { label: string; classes: string; dotColor: string }> = {
  active: {
    label: 'Active',
    classes: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    dotColor: 'bg-emerald-400',
  },
  pending: {
    label: 'Pending',
    classes: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    dotColor: 'bg-yellow-400',
  },
  suspended: {
    label: 'Suspended',
    classes: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    dotColor: 'bg-orange-400',
  },
  revoked: {
    label: 'Revoked',
    classes: 'bg-red-500/15 text-red-400 border border-red-500/30',
    dotColor: 'bg-red-400',
  },
  connected: {
    label: 'Connected',
    classes: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    dotColor: 'bg-emerald-400',
  },
  disconnected: {
    label: 'Disconnected',
    classes: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    dotColor: 'bg-slate-400',
  },
  expired: {
    label: 'Expired',
    classes: 'bg-red-500/15 text-red-400 border border-red-500/30',
    dotColor: 'bg-red-400',
  },
  valid: {
    label: 'Valid',
    classes: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    dotColor: 'bg-emerald-400',
  },
  enabled: {
    label: 'Enabled',
    classes: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    dotColor: 'bg-blue-400',
  },
  disabled: {
    label: 'Disabled',
    classes: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    dotColor: 'bg-slate-400',
  },
}

const defaultConfig = {
  label: '',
  classes: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  dotColor: 'bg-slate-400',
}

export function StatusBadge({ status, size = 'sm', dot = true }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] ?? { ...defaultConfig, label: status }
  const label = config.label || status

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.classes,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
    >
      {dot && (
        <span className={clsx('rounded-full flex-shrink-0', config.dotColor, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
      )}
      {label}
    </span>
  )
}

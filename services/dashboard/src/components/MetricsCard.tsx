import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricsCardProps {
  label: string
  value: string | number
  subLabel?: string
  icon?: LucideIcon
  iconColor?: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string
    label?: string
  }
  loading?: boolean
  className?: string
}

export function MetricsCard({
  label,
  value,
  subLabel,
  icon: Icon,
  iconColor = 'text-blue-400',
  trend,
  loading = false,
  className,
}: MetricsCardProps) {
  return (
    <div
      className={clsx(
        'bg-slate-800/50 border border-slate-700 rounded-lg p-5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            {label}
          </p>
          {loading ? (
            <div className="h-8 w-24 bg-slate-700 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
          )}
          {subLabel && !loading && (
            <p className="mt-1 text-xs text-slate-500">{subLabel}</p>
          )}
        </div>
        {Icon && (
          <div className="ml-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <Icon className={clsx('w-5 h-5', iconColor)} />
            </div>
          </div>
        )}
      </div>

      {trend && !loading && (
        <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-1.5">
          {trend.direction === 'up' ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : trend.direction === 'down' ? (
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <Minus className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span
            className={clsx(
              'text-xs font-medium',
              trend.direction === 'up'
                ? 'text-emerald-400'
                : trend.direction === 'down'
                ? 'text-red-400'
                : 'text-slate-400'
            )}
          >
            {trend.value}
          </span>
          {trend.label && (
            <span className="text-xs text-slate-500">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  )
}

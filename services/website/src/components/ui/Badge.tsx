import { cn } from '@/lib/cn'

type BadgeProps = {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border border-zinc-700 text-zinc-400 bg-zinc-900/50',
        className,
      )}
    >
      {children}
    </span>
  )
}

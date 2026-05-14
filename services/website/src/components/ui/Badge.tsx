import { cn } from '@/lib/cn'

type BadgeProps = {
  children: React.ReactNode
  pip?: boolean
  className?: string
}

export function Badge({ children, pip, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 font-mono uppercase tracking-hud text-[0.6875rem] text-ink border border-ink',
        className,
      )}
    >
      {pip && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-accent-pulse"
          aria-hidden
        />
      )}
      {children}
    </span>
  )
}

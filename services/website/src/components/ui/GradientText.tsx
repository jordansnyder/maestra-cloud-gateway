import { cn } from '@/lib/cn'

type GradientTextProps = {
  children: React.ReactNode
  className?: string
}

export function GradientText({ children, className }: GradientTextProps) {
  return (
    <span
      className={cn(
        'bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent',
        className,
      )}
    >
      {children}
    </span>
  )
}

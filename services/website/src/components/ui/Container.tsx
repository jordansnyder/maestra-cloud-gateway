import { cn } from '@/lib/cn'

type ContainerProps = {
  children: React.ReactNode
  className?: string
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn('max-w-6xl mx-auto px-6', className)}>
      {children}
    </div>
  )
}

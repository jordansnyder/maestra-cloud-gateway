import { cn } from '@/lib/cn'

type ContainerProps = {
  children: React.ReactNode
  className?: string
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={cn(
        'max-w-6xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16',
        className,
      )}
    >
      {children}
    </div>
  )
}

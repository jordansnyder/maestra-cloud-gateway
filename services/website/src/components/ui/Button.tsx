import { cn } from '@/lib/cn'

type ButtonProps = {
  variant?: 'primary' | 'secondary'
  size?: 'default' | 'lg'
  href?: string
  external?: boolean
  children: React.ReactNode
  className?: string
}

export function Button({
  variant = 'primary',
  size = 'default',
  href,
  external,
  children,
  className,
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-950',
    variant === 'primary' && 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950',
    variant === 'secondary' && 'border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-zinc-100',
    size === 'default' && 'px-6 py-3 text-sm',
    size === 'lg' && 'px-8 py-4 text-base',
    className,
  )

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    )
  }

  return <button className={classes}>{children}</button>
}

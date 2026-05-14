import { cn } from '@/lib/cn'

type ButtonProps = {
  variant?: 'primary' | 'secondary'
  size?: 'default' | 'lg'
  href?: string
  external?: boolean
  pip?: boolean
  children: React.ReactNode
  className?: string
}

export function Button({
  variant = 'primary',
  size = 'default',
  href,
  external,
  pip,
  children,
  className,
}: ButtonProps) {
  const classes = cn(
    'group inline-flex items-center justify-center gap-2.5 font-mono uppercase tracking-hud border transition-colors duration-200 ease-settle focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-paper',
    variant === 'primary' &&
      'border-ink bg-ink text-paper hover:bg-paper hover:text-ink',
    variant === 'secondary' &&
      'border-ink bg-transparent text-ink hover:bg-ink hover:text-paper',
    size === 'default' && 'px-5 py-2.5 text-[0.6875rem]',
    size === 'lg' && 'px-7 py-3.5 text-xs',
    className,
  )

  const content = (
    <>
      {pip && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-accent-pulse group-hover:bg-current"
          aria-hidden
        />
      )}
      {children}
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {content}
      </a>
    )
  }

  return <button className={classes}>{content}</button>
}

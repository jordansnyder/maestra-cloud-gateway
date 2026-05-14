import { cn } from '@/lib/cn'

type GlyphSet = 'components' | 'noneditable' | 'editable'
type Tone = 'ink' | 'paper' | 'accent' | 'current'

interface GlyphProps {
  set?: GlyphSet
  id: number
  size?: number | string
  tone?: Tone
  className?: string
  alt?: string
}

const TONE_BG: Record<Exclude<Tone, 'current'>, string> = {
  ink: 'var(--ink)',
  paper: 'var(--paper)',
  accent: 'var(--accent)',
}

export function Glyph({
  set = 'components',
  id,
  size = 120,
  tone = 'ink',
  className,
  alt = '',
}: GlyphProps) {
  const src = `/micrographics/${set}/${id}.svg`
  const dim = typeof size === 'number' ? `${size}px` : size

  return (
    <span
      role={alt ? 'img' : 'presentation'}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn(
        'inline-block shrink-0',
        tone === 'current' && 'bg-current',
        className,
      )}
      style={{
        width: dim,
        height: dim,
        ...(tone !== 'current' && { backgroundColor: TONE_BG[tone] }),
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
      }}
    />
  )
}

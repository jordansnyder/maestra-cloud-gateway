'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { NAV_LINKS } from '@/lib/constants'
import { cn } from '@/lib/cn'

type MobileMenuProps = {
  open: boolean
  onClose: () => void
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-ink/40 z-40 transition-opacity duration-300 md:hidden',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-paper border-l border-ink z-50 transition-transform duration-300 ease-settle md:hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-rule">
          <span className="font-mono uppercase tracking-hud text-xs text-ink">
            Maestra
          </span>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-ink/70 hover:text-ink transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-6 flex flex-col">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={onClose}
              className="block py-4 font-mono uppercase tracking-hud text-xs text-ink/80 hover:text-ink border-b border-rule transition-colors"
              {...(link.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#download"
            onClick={onClose}
            className="mt-8 block w-full text-center bg-ink hover:bg-paper hover:text-ink border border-ink text-paper font-mono uppercase tracking-hud text-xs px-6 py-3.5 transition-colors"
          >
            Download
          </a>
        </nav>
      </div>
    </>
  )
}

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
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 w-72 bg-zinc-900 border-l border-zinc-800 z-50 transition-transform duration-300 md:hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <span className="text-lg font-bold tracking-tight">Maestra</span>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-400 hover:text-zinc-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-6 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={onClose}
              className="block py-3 px-4 text-base text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800/50 rounded-lg transition-colors"
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <a
              href="#download"
              onClick={onClose}
              className="block w-full text-center bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-medium rounded-lg px-6 py-3 transition-colors"
            >
              Download
            </a>
          </div>
        </nav>
      </div>
    </>
  )
}

import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[80vh] flex items-center justify-center px-6 border-b border-rule">
        <div className="max-w-xl text-center">
          <div className="font-mono uppercase tracking-hud text-[0.6875rem] text-ink/60 mb-8">
            ── NO SIGNAL ──
          </div>

          <p className="font-mono text-7xl sm:text-8xl font-medium text-ink leading-none">
            404
          </p>

          <h1 className="mt-10 font-sans text-2xl sm:text-3xl font-medium tracking-display text-ink">
            Lost in the <span className="italic font-light">installation</span>?
          </h1>

          <p className="mt-5 max-w-prose mx-auto text-ink/70 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>

          <Link
            href="/"
            className="mt-10 inline-flex items-center gap-2.5 border border-ink bg-ink text-paper font-mono uppercase tracking-hud text-xs px-6 py-3 hover:bg-paper hover:text-ink transition-colors"
          >
            Back to Home ──→
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}

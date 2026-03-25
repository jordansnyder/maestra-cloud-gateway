import { Monitor, Terminal } from 'lucide-react'
import { DOWNLOAD_LINKS, SITE_CONFIG } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll'

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

const PLATFORMS = [
  { key: 'macos' as const, Icon: AppleIcon },
  { key: 'windows' as const, Icon: Monitor },
  { key: 'linux' as const, Icon: Terminal },
]

export function Download() {
  return (
    <section id="download" className="py-24 md:py-32">
      <Container>
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Get the Desktop App
            </h2>
            <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
              Download Maestra for your platform and start connecting installations.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {PLATFORMS.map(({ key, Icon }, i) => {
            const platform = DOWNLOAD_LINKS[key]
            return (
              <AnimateOnScroll key={key} delay={i * 100}>
                <a
                  href={platform.url}
                  className="group block bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center hover:border-zinc-700 transition-all hover:bg-zinc-900"
                >
                  <Icon className="w-10 h-10 mx-auto text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                  <h3 className="mt-4 text-lg font-semibold">{platform.label}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{platform.arch}</p>
                  <span className="mt-4 inline-block text-sm font-medium text-cyan-500 group-hover:text-cyan-400 transition-colors">
                    Download &rarr;
                  </span>
                </a>
              </AnimateOnScroll>
            )
          })}
        </div>

        <AnimateOnScroll delay={300}>
          <p className="mt-8 text-center text-sm text-zinc-600">
            Or{' '}
            <a
              href={SITE_CONFIG.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-300 underline underline-offset-4 transition-colors"
            >
              build from source
            </a>
          </p>
        </AnimateOnScroll>
      </Container>
    </section>
  )
}

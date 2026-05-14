import { DOWNLOAD_LINKS, SITE_CONFIG } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll'

const PLATFORMS = ['macos', 'windows', 'linux'] as const

export function Download() {
  return (
    <section
      id="download"
      className="py-24 sm:py-32 md:py-40 border-b border-rule"
    >
      <Container>
        <AnimateOnScroll>
          <div className="max-w-3xl mb-16 sm:mb-24">
            <div className="section-label mb-6">[ 04 // DOWNLOAD ]</div>
            <h2 className="font-sans font-medium tracking-display text-[clamp(2rem,5vw,3.75rem)] leading-[1] text-ink">
              Get the <span className="italic font-light">desktop</span> app.
            </h2>
          </div>
        </AnimateOnScroll>

        <div className="max-w-3xl">
          {PLATFORMS.map((key, i) => {
            const platform = DOWNLOAD_LINKS[key]
            return (
              <AnimateOnScroll key={key} delay={i * 80}>
                <a
                  href={platform.url}
                  className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] gap-x-4 sm:gap-x-8 items-center border-t border-rule py-6 hover:bg-paper-2 transition-colors -mx-4 sm:-mx-6 px-4 sm:px-6"
                >
                  <span className="font-mono text-[0.6875rem] tracking-hud text-ink/50">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <span className="font-sans text-lg sm:text-xl text-ink block">
                      {platform.label}
                    </span>
                    <span className="font-mono uppercase tracking-hud text-[0.6875rem] text-ink/55">
                      {platform.arch}
                    </span>
                  </span>
                  <span className="font-mono uppercase tracking-hud text-[0.6875rem] text-ink flex items-center gap-2">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-accent"
                      aria-hidden
                    />
                    <span className="hidden sm:inline">Download</span>
                    <span className="transition-transform group-hover:translate-x-1">
                      ──→
                    </span>
                  </span>
                </a>
              </AnimateOnScroll>
            )
          })}
          <div className="border-t border-rule" />
        </div>

        <AnimateOnScroll delay={300}>
          <p className="mt-10 hud">
            Or{' '}
            <a
              href={SITE_CONFIG.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline underline-offset-4 hover:text-accent transition-colors"
            >
              build from source
            </a>
          </p>
        </AnimateOnScroll>
      </Container>
    </section>
  )
}

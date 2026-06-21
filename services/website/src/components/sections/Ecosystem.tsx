import { ECOSYSTEM } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { Glyph } from '@/components/ui/Glyph'
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll'

export function Ecosystem() {
  return (
    <section
      id="ecosystem"
      className="py-24 sm:py-32 md:py-40 border-b border-rule"
    >
      <Container>
        <AnimateOnScroll>
          <div className="max-w-3xl mb-16 sm:mb-24">
            <div className="section-label mb-6">[ 02 // ECOSYSTEM ]</div>
            <h2 className="font-sans font-medium tracking-display text-[clamp(2rem,5vw,3.75rem)] leading-[1] text-ink">
              One platform,
              <br className="hidden sm:block" /> many{' '}
              <span className="italic font-light">surfaces</span>.
            </h2>
            <p className="mt-8 max-w-prose text-base sm:text-lg text-ink/75 leading-relaxed">
              Maestra is more than a single app. The core runtime, a native
              desktop launcher, nine SDKs, and a cloud federation layer all work
              together — pick the pieces your installation needs.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-rule border border-rule">
          {ECOSYSTEM.map((item, i) => (
            <AnimateOnScroll key={item.title} delay={i * 70}>
              <a
                href={item.href}
                {...(item.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="group relative flex h-full flex-col bg-paper p-8 sm:p-10 transition-colors duration-300 hover:bg-paper-2"
              >
                <div className="mb-8 flex items-start justify-between">
                  <span className="font-mono uppercase tracking-hud text-[0.6875rem] text-ink/50">
                    {item.tag}
                  </span>
                  <Glyph
                    set="components"
                    id={item.glyph}
                    size={56}
                    className="transition-colors duration-300 group-hover:[background-color:var(--accent)]"
                  />
                </div>
                <h3 className="font-sans text-xl sm:text-2xl font-medium tracking-display text-ink leading-snug">
                  {item.title}
                </h3>
                <p className="mt-3 flex-1 text-ink/70 leading-relaxed text-[0.9375rem]">
                  {item.description}
                </p>
                <span className="mt-8 inline-flex items-center gap-2 font-mono uppercase tracking-hud text-[0.6875rem] text-ink">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-accent"
                    aria-hidden
                  />
                  {item.cta}
                  <span className="transition-transform group-hover:translate-x-1">
                    ──→
                  </span>
                </span>
              </a>
            </AnimateOnScroll>
          ))}
        </div>
      </Container>
    </section>
  )
}

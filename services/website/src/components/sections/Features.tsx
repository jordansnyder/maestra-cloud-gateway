import { FEATURES } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { Glyph } from '@/components/ui/Glyph'
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll'

const GLYPH_FOR_ICON: Record<string, number> = {
  ShieldCheck: 1,
  Route: 76,
  Fingerprint: 75,
  Activity: 12,
  Layers: 100,
  ScrollText: 25,
}

export function Features() {
  return (
    <section
      id="features"
      className="py-24 sm:py-32 md:py-40 border-b border-rule"
    >
      <Container>
        <AnimateOnScroll>
          <div className="max-w-3xl mb-16 sm:mb-24">
            <div className="section-label mb-6">[ 01 // FEATURES ]</div>
            <h2 className="font-sans font-medium tracking-display text-[clamp(2rem,5vw,3.75rem)] leading-[1] text-ink">
              Built for what <span className="italic font-light">you</span> build.
            </h2>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-rule border border-rule">
          {FEATURES.map((feature, i) => {
            const glyphId = GLYPH_FOR_ICON[feature.icon] ?? 1
            const num = String(i + 1).padStart(2, '0')
            return (
              <AnimateOnScroll key={feature.title} delay={i * 60}>
                <article className="group relative h-full bg-paper p-8 sm:p-10 transition-colors duration-300 hover:bg-paper-2">
                  <span className="absolute top-4 right-5 font-mono text-[0.6875rem] tracking-hud text-ink/30">
                    {num}
                  </span>
                  <div className="relative mb-8 flex h-28 w-28 items-center justify-center">
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full border border-rule transition-colors duration-300 group-hover:border-accent/40"
                    />
                    <Glyph
                      set="components"
                      id={glyphId}
                      size={72}
                      className="transition-colors duration-300 group-hover:[background-color:var(--accent)]"
                    />
                  </div>
                  <h3 className="font-sans text-xl font-medium tracking-display text-ink leading-snug">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-ink/70 leading-relaxed text-[0.9375rem]">
                    {feature.description}
                  </p>
                </article>
              </AnimateOnScroll>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

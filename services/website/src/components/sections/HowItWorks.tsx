import { STEPS } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { Glyph } from '@/components/ui/Glyph'
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll'

const STEP_GLYPHS = [12, 1, 100]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 sm:py-32 md:py-40 border-b border-rule"
    >
      <Container>
        <AnimateOnScroll>
          <div className="max-w-3xl mb-16 sm:mb-24">
            <div className="section-label mb-6">[ 04 // PROCEDURE ]</div>
            <h2 className="font-sans font-medium tracking-display text-[clamp(2rem,5vw,3.75rem)] leading-[1] text-ink">
              Three steps to <span className="italic font-light">connected</span>.
            </h2>
          </div>
        </AnimateOnScroll>

        <ol className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10 lg:gap-16">
          {STEPS.map((step, i) => (
            <AnimateOnScroll key={step.number} delay={i * 100}>
              <li className="group relative max-w-sm">
                <div className="mb-8 flex items-center gap-5">
                  <span className="font-mono text-[0.6875rem] uppercase tracking-hud text-ink/50">
                    Step / {step.number}
                  </span>
                  <span aria-hidden className="h-px flex-1 bg-rule" />
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full bg-accent"
                  />
                </div>

                <div className="relative mb-10 flex h-40 items-center justify-center bg-paper-2/60">
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 h-3 w-3 border-l border-t border-ink/40"
                  />
                  <span
                    aria-hidden
                    className="absolute right-0 top-0 h-3 w-3 border-r border-t border-ink/40"
                  />
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-ink/40"
                  />
                  <span
                    aria-hidden
                    className="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-ink/40"
                  />
                  <Glyph
                    set="components"
                    id={STEP_GLYPHS[i]}
                    size={104}
                    tone="ink"
                    className="transition-colors duration-300 group-hover:[background-color:var(--accent)]"
                  />
                  <span className="absolute bottom-2 right-3 font-mono text-[0.625rem] tracking-hud text-ink/40">
                    {step.number}
                  </span>
                </div>

                <h3 className="font-sans text-xl font-medium tracking-display text-ink leading-snug">
                  {step.title}
                </h3>
                <p className="mt-3 text-ink/70 leading-relaxed text-[0.9375rem]">
                  {step.description}
                </p>
              </li>
            </AnimateOnScroll>
          ))}
        </ol>
      </Container>
    </section>
  )
}

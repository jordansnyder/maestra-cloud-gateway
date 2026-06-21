import { SDKS } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { Glyph } from '@/components/ui/Glyph'
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll'

export function SDKs() {
  return (
    <section
      id="sdks"
      className="py-24 sm:py-32 md:py-40 border-b border-rule"
    >
      <Container>
        <AnimateOnScroll>
          <div className="max-w-3xl mb-16 sm:mb-24">
            <div className="section-label mb-6">[ 03 // SDKS ]</div>
            <h2 className="font-sans font-medium tracking-display text-[clamp(2rem,5vw,3.75rem)] leading-[1] text-ink">
              Speaks your <span className="italic font-light">tools</span>.
            </h2>
            <p className="mt-8 max-w-prose text-base sm:text-lg text-ink/75 leading-relaxed">
              Nine first-class SDKs, plus native OSC, MQTT, and WebSocket
              bridges. Whatever you build in, Maestra connects to it.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-rule border border-rule">
          {SDKS.map((sdk, i) => (
            <AnimateOnScroll key={sdk.name} delay={i * 40}>
              <a
                href={sdk.doc}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full items-center gap-4 bg-paper p-6 sm:p-7 transition-colors duration-300 hover:bg-paper-2"
              >
                <Glyph
                  set="components"
                  id={sdk.glyph}
                  size={40}
                  className="shrink-0 transition-colors duration-300 group-hover:[background-color:var(--accent)]"
                />
                <span className="min-w-0">
                  <span className="block font-sans text-base sm:text-lg text-ink leading-tight truncate">
                    {sdk.name}
                  </span>
                  <span className="block font-mono uppercase tracking-hud text-[0.625rem] text-ink/55 mt-1 truncate">
                    {sdk.detail}
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

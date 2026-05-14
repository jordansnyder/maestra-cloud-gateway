import { SITE_CONFIG } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { Glyph } from '@/components/ui/Glyph'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center border-b border-rule">
      <Container className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-center">
          <div className="lg:col-span-7 max-w-2xl">
            <div className="section-label mb-6">[ 00 ]</div>

            <h1 className="font-sans font-medium tracking-display text-[clamp(2.5rem,8vw,6rem)] leading-[0.98] text-ink">
              Build worlds
              <br />
              that <span className="italic font-light">respond</span>.
            </h1>

            <p className="mt-8 max-w-prose text-base sm:text-lg text-ink/75 leading-relaxed">
              {SITE_CONFIG.description}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-3">
              <Button href="#download" size="lg" pip>
                Download
              </Button>
              <Button
                href={SITE_CONFIG.docsUrl}
                variant="secondary"
                size="lg"
                external
              >
                Read the Docs
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative aspect-square w-full max-w-xs sm:max-w-sm">
              <Glyph
                set="components"
                id={130}
                size="100%"
                className="absolute inset-0 animate-orbit-slow"
              />
              <Glyph
                set="components"
                id={75}
                size="22%"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                tone="accent"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

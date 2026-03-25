import { SITE_CONFIG } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll'

export function CallToAction() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10" />
      <div className="absolute inset-0 -z-10 bg-zinc-950/80" />

      <Container>
        <AnimateOnScroll>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ready to bring your installation to life?
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Maestra is free, open source, and ready to orchestrate.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button href="#download" size="lg">
                Download Now
              </Button>
              <Button href={SITE_CONFIG.docsUrl} variant="secondary" size="lg" external>
                Read the Docs
              </Button>
            </div>
          </div>
        </AnimateOnScroll>
      </Container>
    </section>
  )
}

import { SITE_CONFIG } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll'

export function CallToAction() {
  return (
    <section className="py-24 sm:py-32 md:py-48 border-b border-rule">
      <Container>
        <AnimateOnScroll>
          <div className="max-w-3xl">
            <div className="section-label mb-6">[ 07 ]</div>
            <h2 className="font-sans font-medium tracking-display text-[clamp(2rem,5.5vw,4.5rem)] leading-[1] text-ink">
              Ready to bring your installation
              <br className="hidden sm:block" /> to{' '}
              <span className="italic font-light">life</span>?
            </h2>

            <div className="mt-12 flex flex-col sm:flex-row gap-3">
              <Button href="#download" size="lg" pip>
                Download
              </Button>
              <Button href={SITE_CONFIG.docsUrl} variant="secondary" size="lg">
                Read the Docs
              </Button>
            </div>
          </div>
        </AnimateOnScroll>
      </Container>
    </section>
  )
}

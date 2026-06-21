import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll'
import { DOCS_SECTIONS, LINKS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'Maestra documentation — getting started, core concepts, SDKs, guides, and the API reference for building immersive, real-time experiences.',
  alternates: { canonical: '/docs' },
}

export default function DocsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="pt-16">
        {/* Intro */}
        <section className="border-b border-rule py-24 sm:py-32">
          <Container>
            <AnimateOnScroll>
              <div className="max-w-3xl">
                <div className="section-label mb-6">[ DOCS // INDEX ]</div>
                <h1 className="font-sans font-medium tracking-display text-[clamp(2.5rem,7vw,5rem)] leading-[1] text-ink">
                  Build with <span className="italic font-light">Maestra</span>.
                </h1>
                <p className="mt-8 max-w-prose text-base sm:text-lg text-ink/75 leading-relaxed">
                  Everything you need to connect a device, model your
                  installation, and orchestrate it in real time. The full
                  documentation lives alongside the source on GitHub — start
                  with the quickstart, then dive into concepts and SDKs.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-3">
                  <Button href={LINKS.quickstart} size="lg" pip external>
                    Quickstart
                  </Button>
                  <Button
                    href={LINKS.docsTree}
                    variant="secondary"
                    size="lg"
                    external
                  >
                    Full Docs on GitHub
                  </Button>
                </div>
              </div>
            </AnimateOnScroll>
          </Container>
        </section>

        {/* Sections grid */}
        <section className="py-24 sm:py-32">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-rule border border-rule">
              {DOCS_SECTIONS.map((section, i) => (
                <AnimateOnScroll key={section.title} delay={i * 50}>
                  <article className="flex h-full flex-col bg-paper p-8 sm:p-10">
                    <span className="font-mono uppercase tracking-hud text-[0.6875rem] text-ink/50">
                      {section.tag}
                    </span>
                    <h2 className="mt-5 font-sans text-xl font-medium tracking-display text-ink leading-snug">
                      {section.title}
                    </h2>
                    <p className="mt-3 text-ink/70 leading-relaxed text-[0.9375rem]">
                      {section.description}
                    </p>
                    <ul className="mt-7 space-y-px">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between gap-3 border-t border-rule py-3 text-[0.9375rem] text-ink/80 hover:text-ink transition-colors"
                          >
                            <span>{link.label}</span>
                            <span
                              aria-hidden
                              className="font-mono text-[0.6875rem] text-ink/40 transition-transform group-hover:translate-x-1 group-hover:text-accent"
                            >
                              ──→
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </article>
                </AnimateOnScroll>
              ))}
            </div>

            <AnimateOnScroll delay={120}>
              <p className="mt-12 hud">
                Can&apos;t find something? Ask in{' '}
                <a
                  href={LINKS.discussions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink underline underline-offset-4 hover:text-accent transition-colors"
                >
                  GitHub Discussions
                </a>{' '}
                or open an{' '}
                <a
                  href={LINKS.issues}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink underline underline-offset-4 hover:text-accent transition-colors"
                >
                  issue
                </a>
                .
              </p>
            </AnimateOnScroll>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  )
}

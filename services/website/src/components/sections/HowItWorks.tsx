import { STEPS } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll'

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32">
      <Container>
        <AnimateOnScroll>
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Three Steps to Connected
            </h2>
            <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
              From standalone to orchestrated in minutes.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent -translate-y-1/2" />
          {/* Mobile connecting line */}
          <div className="md:hidden absolute top-0 bottom-0 left-8 w-px bg-gradient-to-b from-transparent via-zinc-800 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
            {STEPS.map((step, i) => (
              <AnimateOnScroll key={step.number} delay={i * 150}>
                <div className="relative pl-20 md:pl-0 md:text-center">
                  {/* Step number */}
                  <div className="absolute left-0 top-0 md:static md:mb-6">
                    <span className="text-5xl md:text-6xl font-bold bg-gradient-to-b from-cyan-500 to-violet-500 bg-clip-text text-transparent">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

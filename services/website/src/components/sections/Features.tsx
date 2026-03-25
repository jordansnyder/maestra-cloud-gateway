import { ShieldCheck, Route, Fingerprint, Activity, Layers, ScrollText } from 'lucide-react'
import { FEATURES } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll'

const ICON_MAP = {
  ShieldCheck,
  Route,
  Fingerprint,
  Activity,
  Layers,
  ScrollText,
} as const

function FeatureVisual({ icon }: { icon: keyof typeof ICON_MAP }) {
  const Icon = ICON_MAP[icon]
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
          <Icon className="w-10 h-10 md:w-12 md:h-12 text-cyan-500" strokeWidth={1.5} />
        </div>
        <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-2xl blur-xl -z-10" />
      </div>
    </div>
  )
}

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32 bg-zinc-900/50">
      <Container>
        <AnimateOnScroll>
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Built for What You Build
            </h2>
            <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
              Secure orchestration designed for creative installations, not server rooms.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="space-y-16 md:space-y-24">
          {FEATURES.map((feature, i) => (
            <AnimateOnScroll key={feature.title} delay={i * 100}>
              <div
                className={`flex flex-col ${
                  i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                } items-center gap-8 md:gap-16`}
              >
                <div className="flex-shrink-0">
                  <FeatureVisual icon={feature.icon} />
                </div>
                <div className={`text-center ${i % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-zinc-400 leading-relaxed max-w-lg">
                    {feature.description}
                  </p>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </Container>
    </section>
  )
}

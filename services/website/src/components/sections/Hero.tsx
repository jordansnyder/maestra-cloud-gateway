import { SITE_CONFIG } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Container } from '@/components/ui/Container'

function OrchestrationAnimation() {
  return (
    <svg
      viewBox="0 0 400 300"
      className="w-full max-w-lg mx-auto mt-12 md:mt-16"
      aria-hidden="true"
    >
      {/* Connection lines — drawn with stroke-dashoffset animation */}
      <line x1="200" y1="150" x2="80" y2="60" stroke="#06b6d4" strokeWidth="1" strokeDasharray="100" className="animate-draw-line [animation-delay:0.5s] opacity-0 [animation-fill-mode:forwards]" style={{ animationName: 'drawLine' }} />
      <line x1="200" y1="150" x2="320" y2="60" stroke="#06b6d4" strokeWidth="1" strokeDasharray="100" className="animate-draw-line [animation-delay:0.7s] opacity-0 [animation-fill-mode:forwards]" style={{ animationName: 'drawLine' }} />
      <line x1="200" y1="150" x2="60" y2="220" stroke="#06b6d4" strokeWidth="1" strokeDasharray="100" className="animate-draw-line [animation-delay:0.9s] opacity-0 [animation-fill-mode:forwards]" style={{ animationName: 'drawLine' }} />
      <line x1="200" y1="150" x2="340" y2="220" stroke="#06b6d4" strokeWidth="1" strokeDasharray="100" className="animate-draw-line [animation-delay:1.1s] opacity-0 [animation-fill-mode:forwards]" style={{ animationName: 'drawLine' }} />
      <line x1="200" y1="150" x2="200" y2="40" stroke="#06b6d4" strokeWidth="1" strokeDasharray="100" className="animate-draw-line [animation-delay:1.3s] opacity-0 [animation-fill-mode:forwards]" style={{ animationName: 'drawLine' }} />

      {/* Central gateway node */}
      <circle cx="200" cy="150" r="16" fill="#09090b" stroke="#06b6d4" strokeWidth="2" className="animate-pulse-node" />
      <circle cx="200" cy="150" r="6" fill="#06b6d4" className="animate-pulse-node" />

      {/* Device nodes — fade in with stagger */}
      <g className="animate-fade-in [animation-delay:0.6s] opacity-0 [animation-fill-mode:forwards]">
        <circle cx="80" cy="60" r="8" fill="#18181b" stroke="#8b5cf6" strokeWidth="1.5" />
        <circle cx="80" cy="60" r="3" fill="#8b5cf6" />
      </g>
      <g className="animate-fade-in [animation-delay:0.8s] opacity-0 [animation-fill-mode:forwards]">
        <circle cx="320" cy="60" r="8" fill="#18181b" stroke="#8b5cf6" strokeWidth="1.5" />
        <circle cx="320" cy="60" r="3" fill="#8b5cf6" />
      </g>
      <g className="animate-fade-in [animation-delay:1.0s] opacity-0 [animation-fill-mode:forwards]">
        <circle cx="60" cy="220" r="8" fill="#18181b" stroke="#8b5cf6" strokeWidth="1.5" />
        <circle cx="60" cy="220" r="3" fill="#8b5cf6" />
      </g>
      <g className="animate-fade-in [animation-delay:1.2s] opacity-0 [animation-fill-mode:forwards]">
        <circle cx="340" cy="220" r="8" fill="#18181b" stroke="#8b5cf6" strokeWidth="1.5" />
        <circle cx="340" cy="220" r="3" fill="#8b5cf6" />
      </g>
      <g className="animate-fade-in [animation-delay:1.4s] opacity-0 [animation-fill-mode:forwards]">
        <circle cx="200" cy="40" r="8" fill="#18181b" stroke="#8b5cf6" strokeWidth="1.5" />
        <circle cx="200" cy="40" r="3" fill="#8b5cf6" />
      </g>

      {/* Labels */}
      <text x="200" y="180" textAnchor="middle" className="fill-zinc-500 text-[9px]">gateway</text>
      <text x="80" y="85" textAnchor="middle" className="fill-zinc-600 text-[8px]">site-01</text>
      <text x="320" y="85" textAnchor="middle" className="fill-zinc-600 text-[8px]">site-02</text>
      <text x="60" y="245" textAnchor="middle" className="fill-zinc-600 text-[8px]">site-03</text>
      <text x="340" y="245" textAnchor="middle" className="fill-zinc-600 text-[8px]">site-04</text>
      <text x="200" y="27" textAnchor="middle" className="fill-zinc-600 text-[8px]">site-05</text>
    </svg>
  )
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <Container className="text-center pt-24 pb-16">
        <Badge className="mb-8">Open Source</Badge>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto">
          {SITE_CONFIG.tagline}
        </h1>

        <p className="mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {SITE_CONFIG.description}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button href="#download" size="lg">
            Download the App
          </Button>
          <Button href={SITE_CONFIG.docsUrl} variant="secondary" size="lg" external>
            Read the Docs
          </Button>
        </div>

        <OrchestrationAnimation />
      </Container>
    </section>
  )
}

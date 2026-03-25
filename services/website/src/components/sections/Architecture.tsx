import { Container } from '@/components/ui/Container'
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll'

const TECH_BADGES = [
  'NATS', 'FastAPI', 'PostgreSQL', 'mTLS', 'OIDC', 'Redis', 'Envoy',
]

export function Architecture() {
  return (
    <section id="architecture" className="py-24 md:py-32 bg-zinc-900/50">
      <Container>
        <AnimateOnScroll>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Built on Serious Infrastructure
            </h2>
            <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
              Creative on the surface. Cryptographically secure underneath.
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={100}>
          {/* Architecture diagram */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-10 font-mono text-xs md:text-sm text-zinc-500">
              <pre className="overflow-x-auto whitespace-pre leading-relaxed">
{`  Sites (outbound TLS)
    │
    ▼
  Edge Proxy (Envoy)     ← rate limiting, TLS termination
    │
    ▼
  Auth (mTLS + OIDC)     ← cryptographic identity
    │
    ▼
  Message Router         ← policy-driven routing
    │
    ├──▶ Cloud NATS      ← isolated accounts per site
    │
    ▼
  Policy Engine
    │
    ▼
  Control Plane API      ← site mgmt, certs, audit
    │
    ▼
  Dashboard              ← real-time monitoring`}
              </pre>
            </div>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={200}>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
            {TECH_BADGES.map((badge) => (
              <span
                key={badge}
                className="px-3 py-1.5 text-xs font-medium text-zinc-400 border border-zinc-800 rounded-full bg-zinc-950/50"
              >
                {badge}
              </span>
            ))}
          </div>
        </AnimateOnScroll>
      </Container>
    </section>
  )
}

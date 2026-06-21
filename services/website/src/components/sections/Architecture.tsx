import { Container } from '@/components/ui/Container'
import { Glyph } from '@/components/ui/Glyph'
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll'

const STACK = [
  { label: 'Tools & SDKs', detail: 'TouchDesigner · Unreal · Unity · web · Arduino' },
  { label: 'Gateways', detail: 'OSC · MQTT · WebSocket bridges' },
  { label: 'Message Bus', detail: 'NATS · real-time pub/sub · JetStream' },
  { label: 'Entity Store', detail: 'typed state · history in TimescaleDB' },
  { label: 'Fleet Manager', detail: 'devices, entities, streams, shows' },
  { label: 'DMX / Art-Net', detail: 'physical lighting · cues & sequences' },
  { label: 'Flows', detail: 'Node-RED automation & show control' },
  { label: 'Dashboard', detail: 'real-time monitoring · Grafana' },
  { label: 'Cloud Gateway', detail: 'federate sites · mTLS · policy routing' },
]

const TECH = [
  'NATS',
  'FastAPI',
  'PostgreSQL',
  'TimescaleDB',
  'Redis',
  'Node-RED',
  'MQTT',
  'Grafana',
  'Tauri',
]

export function Architecture() {
  return (
    <section
      id="architecture"
      className="py-24 sm:py-32 md:py-40 bg-ink text-paper border-b border-ink"
    >
      <Container>
        <AnimateOnScroll>
          <div className="max-w-3xl mb-16 sm:mb-24">
            <div className="font-mono uppercase tracking-hud text-[0.6875rem] text-paper/60 mb-6">
              [ 05 // ARCHITECTURE ]
            </div>
            <h2 className="font-sans font-medium tracking-display text-[clamp(2rem,5vw,3.75rem)] leading-[1] text-paper">
              Serious infrastructure,
              <br className="hidden sm:block" />{' '}
              <span className="italic font-light">creative</span> on the surface.
            </h2>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <ol className="max-w-3xl">
            {STACK.map((row, i) => (
              <li
                key={row.label}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] sm:grid-cols-[3rem_10rem_minmax(0,1fr)] gap-x-4 sm:gap-x-8 items-baseline border-t border-paper/15 py-4"
              >
                <span className="font-mono text-[0.6875rem] tracking-hud text-paper/40">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-sans text-base sm:text-lg text-paper">
                  {row.label}
                </span>
                <span className="col-span-2 sm:col-span-1 font-mono text-[0.75rem] uppercase tracking-hud text-paper/55 leading-relaxed mt-1 sm:mt-0">
                  {row.detail}
                </span>
              </li>
            ))}
            <li className="border-t border-paper/15" />
          </ol>
        </AnimateOnScroll>

        <AnimateOnScroll delay={100}>
          <div className="mt-16 sm:mt-20 max-w-3xl">
            <div className="font-mono uppercase tracking-hud text-[0.6875rem] text-paper/50">
              {TECH.join(' · ')}
            </div>
          </div>
        </AnimateOnScroll>
      </Container>
    </section>
  )
}

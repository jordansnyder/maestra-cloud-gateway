import { Glyph } from '@/components/ui/Glyph'

const SETS = [
  { name: 'components' as const, count: 150 },
  { name: 'editable' as const, count: 70 },
  { name: 'noneditable' as const, count: 70 },
]

export default function GlyphsPage() {
  return (
    <main className="min-h-screen bg-paper py-16">
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="font-sans text-4xl font-medium tracking-display mb-2">
          Micrographics Index
        </h1>
        <p className="font-mono text-xs uppercase tracking-hud text-ink/50 mb-12">
          Click an ID to copy. Three sets, 290 glyphs total.
        </p>

        {SETS.map((set) => (
          <section key={set.name} className="mb-20">
            <div className="mb-6 flex items-baseline gap-4 border-b border-rule pb-3">
              <h2 className="font-sans text-2xl font-medium tracking-display">
                {set.name}
              </h2>
              <span className="font-mono text-xs uppercase tracking-hud text-ink/50">
                {set.count} glyphs
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-px bg-rule border border-rule">
              {Array.from({ length: set.count }, (_, i) => i + 1).map((id) => (
                <div
                  key={id}
                  className="group relative flex aspect-square flex-col items-center justify-center bg-paper p-3 transition-colors hover:bg-paper-2"
                >
                  <Glyph set={set.name} id={id} size={48} tone="ink" />
                  <span className="mt-2 font-mono text-[0.625rem] tracking-hud text-ink/40 group-hover:text-ink">
                    {String(id).padStart(3, '0')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}

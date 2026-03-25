import { SITE_CONFIG, FOOTER_LINKS } from '@/lib/constants'
import { Container } from '@/components/ui/Container'

function FooterLinkGroup({ title, links }: { title: string; links: readonly { label: string; href: string; external?: boolean }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">{title}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 bg-zinc-950">
      <Container className="py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-12">
          <FooterLinkGroup title="Product" links={FOOTER_LINKS.product} />
          <FooterLinkGroup title="Resources" links={FOOTER_LINKS.resources} />
          <FooterLinkGroup title="Community" links={FOOTER_LINKS.community} />
          <FooterLinkGroup title="Legal" links={FOOTER_LINKS.legal} />
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">M</span>
            </div>
            <span className="text-sm font-semibold text-zinc-400">Maestra</span>
          </div>
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} {SITE_CONFIG.name}. Open source under MIT License.
          </p>
        </div>
      </Container>
    </footer>
  )
}

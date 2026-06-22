import { SITE_CONFIG, FOOTER_LINKS } from '@/lib/constants'
import { Container } from '@/components/ui/Container'

function FooterLinkGroup({
  title,
  links,
}: {
  title: string
  links: readonly { label: string; href: string; external?: boolean }[]
}) {
  return (
    <div>
      <h3 className="font-mono uppercase tracking-hud text-[0.6875rem] text-ink/60 mb-4">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-sm text-ink/75 hover:text-ink transition-colors"
              {...(link.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
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
    <footer className="bg-paper">
      <Container className="py-16 sm:py-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-12 mb-16">
          <FooterLinkGroup title="Product" links={FOOTER_LINKS.product} />
          <FooterLinkGroup title="Resources" links={FOOTER_LINKS.resources} />
          <FooterLinkGroup title="Community" links={FOOTER_LINKS.community} />
          <FooterLinkGroup title="Legal" links={FOOTER_LINKS.legal} />
        </div>

        <div className="pt-8 border-t border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 border border-ink flex items-center justify-center">
              <span className="font-mono text-xs font-bold text-ink leading-none">
                M
              </span>
            </div>
            <span className="font-mono uppercase tracking-hud text-[0.6875rem] text-ink/70">
              {SITE_CONFIG.name} ── © {new Date().getFullYear()} ── BSL-1.1 · SDKs MIT
            </span>
          </div>
        </div>
      </Container>
    </footer>
  )
}

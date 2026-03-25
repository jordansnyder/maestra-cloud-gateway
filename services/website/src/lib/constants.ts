export const SITE_CONFIG = {
  name: 'Maestra',
  tagline: 'Build Worlds That Respond.',
  description: 'Connect devices, locations, and experiences with open-source orchestration.',
  url: 'https://maestra.cc',
  github: 'https://github.com/maestracc/maestra',
  docsUrl: '#',
}

export const NAV_LINKS: readonly { label: string; href: string; external?: boolean }[] = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Download', href: '#download' },
  { label: 'Docs', href: SITE_CONFIG.docsUrl, external: true },
]

export const FEATURES = [
  {
    title: 'Your Installations Stay Private',
    description: 'Sites never expose ports. All connections are initiated outbound through encrypted tunnels — your installations remain invisible to the outside world.',
    icon: 'ShieldCheck' as const,
  },
  {
    title: 'You Decide What Flows Where',
    description: 'Every message between sites requires an explicit policy. Nothing crosses boundaries without your permission. Complete control over what data goes where.',
    icon: 'Route' as const,
  },
  {
    title: 'Cryptographic Trust',
    description: 'Every device is verified with mutual TLS certificates. No passwords, no tokens — mathematical proof that each connection is exactly who it claims to be.',
    icon: 'Fingerprint' as const,
  },
  {
    title: 'See Everything in Real Time',
    description: 'A live dashboard shows every connected site, every message flow, every heartbeat. Know the state of your entire installation network at a glance.',
    icon: 'Activity' as const,
  },
  {
    title: 'Isolated by Design',
    description: 'Each site gets its own cryptographically isolated account. A compromise at one location cannot affect another. Security is architectural, not bolted on.',
    icon: 'Layers' as const,
  },
  {
    title: 'Full History, Always',
    description: 'Every action, every connection, every policy change is logged with full context. When something happens, you can trace exactly what, when, and why.',
    icon: 'ScrollText' as const,
  },
] as const

export const STEPS = [
  {
    number: '01',
    title: 'Install the Agent',
    description: 'Drop the lightweight agent onto each site. It connects outbound to the cloud gateway — no ports to open, no firewall rules to manage.',
  },
  {
    number: '02',
    title: 'Connect to the Gateway',
    description: 'The agent authenticates with its unique certificate and joins the cloud mesh. Your sites can now see each other through the secure relay.',
  },
  {
    number: '03',
    title: 'Define and Create',
    description: 'Set policies for what flows between sites. Route messages, synchronize state, orchestrate experiences across locations — all through a single control plane.',
  },
] as const

export const DOWNLOAD_LINKS = {
  macos: { url: '#', label: 'macOS', arch: 'Universal (Apple Silicon + Intel)', icon: 'Apple' as const },
  windows: { url: '#', label: 'Windows', arch: 'x64', icon: 'Monitor' as const },
  linux: { url: '#', label: 'Linux', arch: 'x64 (.deb, .AppImage)', icon: 'Terminal' as const },
} as const

export const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Download', href: '#download' },
    { label: 'Architecture', href: '#architecture' },
  ],
  resources: [
    { label: 'Documentation', href: SITE_CONFIG.docsUrl, external: true },
    { label: 'GitHub', href: SITE_CONFIG.github, external: true },
    { label: 'Release Notes', href: `${SITE_CONFIG.github}/releases`, external: true },
  ],
  community: [
    { label: 'Discord', href: '#' },
    { label: 'Twitter / X', href: '#' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ],
} as const

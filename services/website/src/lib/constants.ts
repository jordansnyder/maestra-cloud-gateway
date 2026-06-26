const GITHUB = 'https://github.com/jordansnyder/maestra-core'
const GITHUB_GATEWAY = 'https://github.com/jordansnyder/maestra-cloud-gateway'
const DOCS_BASE = `${GITHUB}/blob/main`
const TREE_BASE = `${GITHUB}/tree/main`

export const SITE_CONFIG = {
  name: 'Maestra',
  tagline: 'Build Worlds That Respond.',
  description:
    'Open-source infrastructure for immersive experiences. Connect any device, creative tool, or location to a shared real-time nervous system — and orchestrate it all.',
  url: 'https://maestra.cc',
  github: GITHUB,
  githubGateway: GITHUB_GATEWAY,
  docsUrl: '/docs',
  releasesUrl: `${GITHUB}/releases`,
}

export const LINKS = {
  github: GITHUB,
  githubGateway: GITHUB_GATEWAY,
  releases: `${GITHUB}/releases`,
  releasesLatest: `${GITHUB}/releases/latest`,
  discussions: `${GITHUB}/discussions`,
  issues: `${GITHUB}/issues`,
  license: `${DOCS_BASE}/LICENSE`,
  changelog: `${DOCS_BASE}/CHANGELOG.md`,
  quickstart: `${DOCS_BASE}/QUICKSTART.md`,
  readme: `${GITHUB}#readme`,
  docsTree: `${TREE_BASE}/docs/docs`,
} as const

export const NAV_LINKS: readonly { label: string; href: string; external?: boolean }[] = [
  { label: 'Features', href: '/#features' },
  { label: 'Ecosystem', href: '/#ecosystem' },
  { label: 'SDKs', href: '/#sdks' },
  { label: 'Download', href: '/#download' },
  { label: 'Docs', href: SITE_CONFIG.docsUrl },
]

export const FEATURES = [
  {
    title: 'Real-Time Entity State',
    description:
      'Define logical things — rooms, lights, sensors, scenes — as entities with typed state. Any connected device reads or writes that state, and changes broadcast everywhere in milliseconds.',
    icon: 'Activity' as const,
  },
  {
    title: 'Works With Your Tools',
    description:
      'First-class SDKs for TouchDesigner, Unreal, Unity, Max/MSP, Arduino, the web, and more. Maestra speaks OSC, MQTT, WebSocket, and NATS so your existing toolchain just plugs in.',
    icon: 'Layers' as const,
  },
  {
    title: 'Peer-to-Peer Streaming',
    description:
      'Share live video and data — NDI, Syphon, Spout, audio, and sensor feeds — directly between devices. The bus negotiates the connection; the high-bandwidth data flows peer to peer.',
    icon: 'Route' as const,
  },
  {
    title: 'Physical Lighting & DMX',
    description:
      'Drive real fixtures over Art-Net / DMX512 from any SDK. Program cues and sequences, cross-fade between looks, and trigger playback from a sensor, a flow, or the dashboard.',
    icon: 'Fingerprint' as const,
  },
  {
    title: 'Visual Flows & Show Control',
    description:
      'Orchestrate without code using built-in Node-RED flows, then drive a full show lifecycle — idle, pre-show, active, paused, shutdown — on a schedule or a single trigger.',
    icon: 'ScrollText' as const,
  },
  {
    title: 'Connect Every Location',
    description:
      'Federate installations across sites with the Cloud Gateway. Outbound-only TLS, per-site cryptographic isolation, and policy-driven routing so every cross-site message is explicitly allowed.',
    icon: 'ShieldCheck' as const,
  },
] as const

export const ECOSYSTEM = [
  {
    tag: 'CORE',
    title: 'Maestra Core',
    description:
      'The real-time platform: a NATS message bus, entity-state store, protocol gateways, and visual flows. Runs anywhere Docker does — a laptop, a Pi, or a rack.',
    href: LINKS.github,
    cta: 'View on GitHub',
    glyph: 130,
    external: true,
  },
  {
    tag: 'DESKTOP',
    title: 'Desktop App',
    description:
      'A signed, notarized native app for macOS, Windows, and Linux. One click to launch the whole stack locally, check service health, and edit your configuration.',
    href: '/#download',
    cta: 'Download',
    glyph: 75,
    external: false,
  },
  {
    tag: 'SDKS',
    title: 'Nine SDKs',
    description:
      'Python, JavaScript/TypeScript, Unity, Unreal, TouchDesigner, Max/MSP, Processing, openFrameworks, and Arduino — connect the creative tools you already use.',
    href: '/#sdks',
    cta: 'Browse SDKs',
    glyph: 100,
    external: false,
  },
  {
    tag: 'GATEWAY',
    title: 'Cloud Gateway',
    description:
      'The federation layer. Securely link multiple Maestra installations across physical locations with mutual TLS, per-site isolation, and policy-driven message routing.',
    href: LINKS.githubGateway,
    cta: 'View on GitHub',
    glyph: 1,
    external: true,
  },
] as const

export const SDKS = [
  { name: 'Python', detail: 'Async-first · pip install', glyph: 8, doc: `${DOCS_BASE}/docs/docs/sdks/python.md` },
  { name: 'JavaScript / TS', detail: 'Browser + Node', glyph: 9, doc: `${DOCS_BASE}/docs/docs/sdks/javascript.md` },
  { name: 'Unity', detail: 'C# · MonoBehaviour', glyph: 10, doc: `${DOCS_BASE}/docs/docs/sdks/unity.md` },
  { name: 'Unreal Engine', detail: 'C++ · Blueprints', glyph: 11, doc: `${DOCS_BASE}/docs/docs/sdks/unreal.md` },
  { name: 'TouchDesigner', detail: 'Python extension', glyph: 12, doc: `${DOCS_BASE}/docs/docs/sdks/touchdesigner.md` },
  { name: 'Max / MSP', detail: 'OSC abstractions', glyph: 13, doc: `${DOCS_BASE}/docs/docs/sdks/max-msp.md` },
  { name: 'Processing', detail: 'MQTT · thread-safe', glyph: 14, doc: `${DOCS_BASE}/docs/docs/sdks/processing.md` },
  { name: 'openFrameworks', detail: 'ofxMaestra addon', glyph: 15, doc: `${DOCS_BASE}/docs/docs/sdks/openframeworks.md` },
  { name: 'Arduino / ESP32', detail: 'MQTT · microcontrollers', glyph: 16, doc: `${DOCS_BASE}/docs/docs/sdks/arduino.md` },
] as const

export const STEPS = [
  {
    number: '01',
    title: 'Connect Your Tools',
    description:
      'Drop a Maestra SDK into TouchDesigner, Unreal, a microcontroller, or the browser. It connects to the message bus over the protocol your tool already speaks — no glue code.',
  },
  {
    number: '02',
    title: 'Define Entities & Flows',
    description:
      'Model your installation as entities with typed state, then wire behavior visually with Node-RED flows. Any device can read or write state in real time.',
  },
  {
    number: '03',
    title: 'Orchestrate & Scale',
    description:
      'Run shows on a schedule, drive DMX lighting, stream live media peer to peer — then federate across locations with the Cloud Gateway when one site is not enough.',
  },
] as const

// Desktop release assets. Direct, version-pinned download URLs for the
// published desktop/v0.2.0 release on GitHub.
const DL = `${GITHUB}/releases/download/desktop/v0.2.0`

export const DOWNLOAD_LINKS = {
  macos_arm: {
    url: `${DL}/Maestra_0.2.0_aarch64.dmg`,
    label: 'macOS',
    arch: 'Apple Silicon (.dmg)',
    icon: 'Apple' as const,
  },
  macos_intel: {
    url: `${DL}/Maestra_0.2.0_x64.dmg`,
    label: 'macOS',
    arch: 'Intel (.dmg)',
    icon: 'Apple' as const,
  },
  windows: {
    url: `${DL}/Maestra_0.2.0_x64_en-US.msi`,
    label: 'Windows',
    arch: 'x64 (.msi)',
    icon: 'Monitor' as const,
  },
  linux: {
    url: `${DL}/Maestra_0.2.0_amd64.AppImage`,
    label: 'Linux',
    arch: 'x64 (.AppImage · .deb also available)',
    icon: 'Terminal' as const,
  },
} as const

export const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '/#features' },
    { label: 'Ecosystem', href: '/#ecosystem' },
    { label: 'SDKs', href: '/#sdks' },
    { label: 'Download', href: '/#download' },
  ],
  resources: [
    { label: 'Documentation', href: SITE_CONFIG.docsUrl },
    { label: 'Quickstart', href: LINKS.quickstart, external: true },
    { label: 'GitHub', href: LINKS.github, external: true },
    { label: 'Release Notes', href: LINKS.releases, external: true },
  ],
  community: [
    { label: 'Discussions', href: LINKS.discussions, external: true },
    { label: 'Issues', href: LINKS.issues, external: true },
    { label: 'Cloud Gateway', href: LINKS.githubGateway, external: true },
  ],
  legal: [
    { label: 'License', href: LINKS.license, external: true },
    { label: 'Changelog', href: LINKS.changelog, external: true },
  ],
} as const

export const DOCS_SECTIONS = [
  {
    tag: 'START',
    title: 'Getting Started',
    description: 'Install Maestra and connect your first device in about five minutes.',
    links: [
      { label: 'Quickstart', href: `${DOCS_BASE}/QUICKSTART.md` },
      { label: 'Installation', href: `${DOCS_BASE}/docs/docs/setup/installation.md` },
      { label: 'Configuration', href: `${DOCS_BASE}/docs/docs/setup/configuration.md` },
      { label: 'Project README', href: LINKS.readme },
    ],
  },
  {
    tag: 'CONCEPTS',
    title: 'Core Concepts',
    description: 'How Maestra models state, events, routing, and streams under the hood.',
    links: [
      { label: 'Entities & State', href: `${DOCS_BASE}/docs/docs/concepts/entities.md` },
      { label: 'Events', href: `${DOCS_BASE}/docs/docs/concepts/events.md` },
      { label: 'Routing', href: `${DOCS_BASE}/docs/docs/concepts/routing.md` },
      { label: 'Streams', href: `${DOCS_BASE}/docs/docs/concepts/streams.md` },
    ],
  },
  {
    tag: 'SDKS',
    title: 'SDKs',
    description: 'Connect TouchDesigner, Unreal, Unity, the web, microcontrollers, and more.',
    links: [
      { label: 'SDK Overview', href: `${DOCS_BASE}/docs/docs/sdks/overview.md` },
      { label: 'Choose Your SDK', href: `${DOCS_BASE}/docs/docs/guides/choose-your-sdk.md` },
      { label: 'Python', href: `${DOCS_BASE}/docs/docs/sdks/python.md` },
      { label: 'JavaScript / Web', href: `${DOCS_BASE}/docs/docs/sdks/web.md` },
    ],
  },
  {
    tag: 'GUIDES',
    title: 'Guides',
    description: 'Task-focused walkthroughs for the things you will actually build.',
    links: [
      { label: 'DMX Gateway', href: `${DOCS_BASE}/docs/docs/guides/dmx-gateway.md` },
      { label: 'Node-RED Flows', href: `${DOCS_BASE}/docs/docs/guides/nodered.md` },
      { label: 'Show Control', href: `${DOCS_BASE}/docs/docs/guides/show-control.md` },
      { label: 'Streams', href: `${DOCS_BASE}/docs/docs/guides/streams.md` },
    ],
  },
  {
    tag: 'API',
    title: 'API Reference',
    description: 'REST and message-bus reference for the Fleet Manager and gateways.',
    links: [
      { label: 'Fleet Manager', href: `${DOCS_BASE}/docs/docs/api/fleet-manager.md` },
      { label: 'Entities API', href: `${DOCS_BASE}/docs/docs/api/entities.md` },
      { label: 'WebSocket', href: `${DOCS_BASE}/docs/docs/api/websocket.md` },
      { label: 'Show Control', href: `${DOCS_BASE}/docs/docs/api/show-control.md` },
    ],
  },
  {
    tag: 'OPERATE',
    title: 'Architecture & Ops',
    description: 'Service map, monitoring, and how to run Maestra in production.',
    links: [
      { label: 'Architecture Overview', href: `${DOCS_BASE}/docs/docs/architecture/overview.md` },
      { label: 'Services', href: `${DOCS_BASE}/docs/docs/architecture/services.md` },
      { label: 'Monitoring', href: `${DOCS_BASE}/docs/docs/guides/monitoring.md` },
      { label: 'Cloud Gateway', href: `${GITHUB_GATEWAY}#readme` },
    ],
  },
] as const

# DESIGN.md — Maestra Brand Identity

## Brand Positioning

Maestra is an open-source orchestration platform for immersive experiences. It connects multi-device, multi-location installations — the kind of interactivity found at Disney, Meow Wolf, and The Void.

**Target audience:** Creative technologists, Imagineers, experience designers — artists who code.

**Voice:** Speak to creators, not sysadmins. Show what's possible, not how it works. Technical details are background credibility, never headlines.

**Aesthetic:** Apple-like minimal. Dark, clean, confident. Every element earns its pixels. The site should feel like the immersive experiences Maestra enables — not like enterprise software.

---

## Color System

### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `bg-primary` | `zinc-950` (#09090b) | Page background, hero, main sections |
| `bg-elevated` | `zinc-900` (#18181b) | Cards, elevated surfaces |
| `bg-subtle` | `zinc-900/50` | Alternating section backgrounds |
| `bg-border` | `zinc-800` (#27272a) | Borders, dividers |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| `text-primary` | `zinc-50` (#fafafa) | Headlines, primary content |
| `text-secondary` | `zinc-400` (#a1a1aa) | Subtitles, descriptions |
| `text-muted` | `zinc-500` (#71717a) | Captions, labels, metadata |
| `text-body` | `zinc-300` (#d4d4d8) | Body text, paragraphs |

### Accent
| Token | Value | Usage |
|-------|-------|-------|
| `accent-solid` | `cyan-500` (#06b6d4) | Buttons, links, interactive elements |
| `accent-gradient` | `cyan-500` → `violet-500` | Hero gradient, CTA backgrounds, decorative |
| `accent-hover` | `cyan-400` (#22d3ee) | Hover states |

### Visual Rhythm
Sections alternate between `bg-primary` and `bg-subtle` to create visual landmarks:
- Hero: `zinc-950` + gradient mesh
- Features: `zinc-900/50`
- How It Works: `zinc-950`
- Architecture: `zinc-900/50`
- Download: `zinc-950`
- CTA: accent gradient banner

---

## Typography

**Font:** Inter — loaded via `next/font/google` (auto-self-hosted, zero layout shift)

| Scale | Class | Usage |
|-------|-------|-------|
| Hero | `text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight` | Main headline |
| Hero (mobile) | `text-4xl font-bold tracking-tight` | Main headline on small screens |
| Section heading | `text-3xl md:text-4xl font-bold tracking-tight` | Section titles |
| Section subtitle | `text-lg md:text-xl text-zinc-400` | Below section headings |
| Body | `text-base text-zinc-300 leading-relaxed` | Paragraphs, descriptions |
| Small | `text-sm text-zinc-500` | Captions, metadata, labels |
| Button | `text-sm font-medium` | Button labels |

---

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| Section padding | `py-24 md:py-32` | Vertical spacing between sections |
| Container | `max-w-6xl mx-auto px-6` | Content width constraint |
| Card padding | `p-6 md:p-8` | Internal card spacing |
| Component gap | `gap-8 md:gap-12` | Between cards, feature rows |

---

## Animation Principles

1. **CSS/SVG only** — zero JavaScript animation libraries
2. **Respect `prefers-reduced-motion: reduce`** — all animations must check this media query and provide static fallbacks
3. **Entrance animations:** fade-in + slide-up on scroll via IntersectionObserver (`AnimateOnScroll` component)
4. **Hero animation:** 4-6 abstract nodes with staggered `animation-delay`, connected by lines drawn via `stroke-dashoffset`. A pulse radiates from a central gateway node. ~50 lines of CSS keyframes + inline SVG.
5. **Hover transitions:** `transition-colors duration-200` on interactive elements
6. **No decorative motion** — every animation must improve hierarchy or communicate state

---

## Component Patterns

### Buttons
- **Primary:** `bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-medium rounded-lg px-6 py-3`
- **Secondary/Ghost:** `border border-zinc-700 hover:border-zinc-600 text-zinc-300 rounded-lg px-6 py-3`

### Cards (used sparingly — cards must earn their existence)
- `bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors`

### Feature Rows (preferred over card grids)
- Full-width alternating layout: text on one side, abstract SVG visual on the other
- Alternates left/right alignment per row (Apple product page style)
- On mobile: stacks single-column, visual above text

### Header
- Fixed with `backdrop-blur-lg bg-zinc-950/80 border-b border-zinc-800/50`
- Transitions from transparent to blurred on scroll

---

## Responsive Breakpoints

| Viewport | Width | Key Changes |
|----------|-------|-------------|
| Mobile | 375px | Single-column everything, `text-4xl` hero, stacked CTAs, 2-col footer, 44px touch targets |
| Tablet | 768px | 2-col features, 3-col footer, side-by-side CTAs |
| Desktop | 1280px+ | Full alternating feature rows, 4-col footer, full animation |

---

## Accessibility

- Color contrast: zinc-50 on zinc-950 = >15:1 ratio (exceeds WCAG AAA)
- Touch targets: 44px minimum on all interactive elements
- Focus indicators: visible ring on all focusable elements
- Skip-to-content link in layout
- Heading hierarchy: h1 in hero, h2 for section headings
- Keyboard navigation for all interactive elements (header, mobile menu, buttons)
- `prefers-reduced-motion` respected for all animations

---

## Anti-Patterns (Never Do This)

1. 3-column symmetrical card grids with icons in colored circles
2. Centered everything with uniform spacing
3. Generic hero copy ("Welcome to...", "Unlock the power of...")
4. Purple/violet gradient backgrounds as primary design element
5. Decorative blobs, floating circles, wavy SVG dividers
6. Emoji as design elements
7. Same background color on every section (use visual rhythm)
8. "Stacked on mobile" without intentional mobile layout decisions

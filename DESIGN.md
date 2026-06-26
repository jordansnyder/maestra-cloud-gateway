# DESIGN.md — Maestra Brand Identity

> Source of truth: the implemented site in `services/website`
> (`src/app/globals.css`, `tailwind.config.ts`, `src/app/layout.tsx`). Keep this
> document in sync with that code — when they disagree, the code wins.

## Brand Positioning

Maestra is an open-source orchestration platform for immersive experiences. It connects multi-device, multi-location installations — the kind of interactivity found at Disney, Meow Wolf, and The Void.

**Target audience:** Creative technologists, Imagineers, experience designers — artists who code.

**Tagline:** "Build Worlds That Respond."

**Voice:** Speak to creators, not sysadmins. Show what's possible, not how it works. Technical details are background credibility, never headlines.

**Aesthetic:** Editorial / Swiss print. Warm paper, black ink, one decisive red. Confident, structured, and quiet — closer to a technical field manual or an art-book spec sheet than to dark SaaS. Monospace HUD labels, registration marks, and a faint dot grid give it a precise, blueprint feeling. Every element earns its place; nothing decorates.

---

## Color System

A small, deliberate palette: warm paper, ink, one accent. No gradients as a primary device.

| Token | Value | Usage |
|-------|-------|-------|
| `ink` | `#0A0A0A` | Primary text, masthead, strong marks |
| `paper` | `#F4F1EA` | Page background |
| `paper-2` | `#EBE7DD` | Recessed panels, code surfaces, alternating sections |
| `ash` | `#6B6660` | Secondary text, captions, HUD labels |
| `accent` | `#E2462E` | The single red — links, active state, key marks, one CTA per view |
| `rule` | `rgba(10, 10, 10, 0.12)` | Hairline rules, borders, dividers |

**Selection:** ink background, paper text (`::selection { background: ink; color: paper }`).

**Restraint:** the red is a punctuation mark, not a fill. Use it for the primary action, the active link, and the occasional registration accent — not for backgrounds, cards, or decoration. When everything is red, nothing is.

---

## Typography

Two families, loaded via `next/font/google` (auto self-hosted, zero layout shift).

- **Space Grotesk** (`--font-grotesk`) — display and body. Tight, geometric, confident.
- **JetBrains Mono** (`--font-mono`) — HUD micro-labels, code, metadata, anything that should read as "instrument."

`font-feature-settings: 'ss01', 'cv11'` is enabled on the body.

| Scale | Class | Usage |
|-------|-------|-------|
| Display | `text-5xl md:text-7xl font-bold tracking-display` | Hero headline |
| Section heading | `text-3xl md:text-4xl font-bold tracking-display` | Section titles |
| Body | `text-base leading-relaxed text-ink` (cap width `max-w-prose` = 60ch) | Paragraphs |
| Secondary | `text-ash` | Subtitles, descriptions |
| HUD label | `.hud` — `font-mono uppercase tracking-hud text-[0.6875rem] text-ash` | Eyebrows, metadata |
| Section label | `.section-label` — mono, e.g. `[ 06 // DOWNLOAD ]` | Numbered section markers |

**Letter spacing:** `tracking-display` = `-0.02em` (headlines), `tracking-hud` = `0.08em` (mono labels). Headlines tighten; HUD labels open up.

---

## Shape & Structure

- **Sharp corners everywhere.** `borderRadius.none` is the default; the design uses square corners as a deliberate signature. The only exception is true circles (dots, registration marks).
- **Hairline rules** (`rule`) separate sections and frame panels — thin, ink at 12% opacity.
- **Dot grid** (`.grid-dots`) — `radial-gradient(rgba(10,10,10,0.10) 1px, transparent 1px)` at a 24px cell. A faint blueprint texture behind content, not a foreground element.
- **Registration marks** (`.registration`) — small circular crop marks at opposing corners, evoking print registration. Use sparingly as a structural accent.

---

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| Section padding | `py-24 md:py-32` | Vertical rhythm between sections |
| Container | `max-w-6xl mx-auto px-6` | Content width |
| Prose width | `max-w-prose` (60ch) | Running text |
| Component gap | `gap-8 md:gap-12` | Between feature rows |

---

## Motion

1. **CSS/SVG only** — no JavaScript animation libraries.
2. **Respect `prefers-reduced-motion: reduce`** — animations collapse to ~0.01ms; provide static fallbacks.
3. **Settle easing:** `cubic-bezier(0.2, 0.8, 0.2, 1)` is the house curve — a quick, decisive settle.
4. **Vocabulary** (from `tailwind.config.ts`):
   - `tick-in` — fade + 4px rise; entrance for list/HUD items.
   - `draw-line` — `stroke-dashoffset` line draw; for connective SVG.
   - `register` — registration marks snapping into place.
   - `orbit-slow` — 80s linear orbit; ambient structural motion.
   - `accent-pulse` — 2.4s opacity pulse on the red; signals "live."
5. **No decorative motion** — every animation improves hierarchy or communicates state.

---

## Component Patterns

### Buttons
- **Primary:** ink fill, paper text, square corners, one per view. The red is reserved for links/marks, not button fills (keeps the accent rare).
- **Secondary/Ghost:** `border border-rule text-ink hover:border-ink/40`, square.

### HUD labels
Uppercase JetBrains Mono, `tracking-hud`, `ash`. Used as eyebrows above headings and as metadata. This is the brand's most recognizable type signature.

### Feature Rows (preferred over card grids)
- Full-width alternating layout: text on one side, abstract SVG/diagram on the other.
- Alternates left/right per row.
- Mobile: single column, visual above text.

### Header
- Fixed, `backdrop-blur` over `paper/80`, hairline `border-b border-rule`.
- Transitions from transparent to blurred on scroll.
- Wordmark in Space Grotesk; the mark may carry the red.

---

## Responsive Breakpoints

| Viewport | Width | Key Changes |
|----------|-------|-------------|
| Mobile | 375px | Single-column, `text-5xl` hero, stacked CTAs, 44px touch targets |
| Tablet | 768px | 2-col features, side-by-side CTAs |
| Desktop | 1280px+ | Full alternating feature rows, full motion |

---

## Accessibility

- Color contrast: ink (`#0A0A0A`) on paper (`#F4F1EA`) ≈ 17:1 (exceeds WCAG AAA).
- Touch targets: 44px minimum on all interactive elements.
- Focus indicators: visible ring on all focusable elements.
- Skip-to-content link in layout (`focus:bg-ink focus:text-paper`).
- Heading hierarchy: h1 in hero, h2 for section headings.
- Keyboard navigation for header, mobile menu, and buttons.
- `prefers-reduced-motion` respected for all animations.

---

## Anti-Patterns (Never Do This)

1. Dark "SaaS dashboard" treatment — dark zinc/slate backgrounds with cyan/violet accents. (This is the look an earlier draft of this doc described; it is **not** the brand.)
2. Rounded corners and soft shadows as the default — the brand is square and flat.
3. Gradient backgrounds (cyan→violet or otherwise) as a primary design element.
4. The red used as a fill or background instead of a rare accent.
5. 3-column symmetrical card grids with icons in colored circles.
6. Centered everything with uniform spacing and no structural rhythm.
7. Generic hero copy ("Welcome to…", "Unlock the power of…").
8. Decorative blobs, floating circles, wavy SVG dividers, emoji as design elements.
9. Same background on every section — alternate `paper` and `paper-2` for visual landmarks.

---

## Companion Surfaces

The Maestra **dashboard** and **docs** (in the `maestra-core` repo) share this identity: Space Grotesk + JetBrains Mono, the red accent, square corners, and HUD labels. They add a **dark "sibling" theme** (warm near-black surfaces, brightened accent `#F2543C`) behind a user toggle, since an operational dashboard benefits from a dark base for long viewing. The marketing site stays light-only — it is the canonical expression of the brand.

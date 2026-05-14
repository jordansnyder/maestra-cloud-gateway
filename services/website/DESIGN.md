# Maestra Website — Design System

> Clean, simple, artistic. Technical instrumentation meets editorial print.

The website's visual language is built around the **Micrographics Vol.1** library by Fox Rockett Studio: monochrome, schematic, slightly sci-fi line work — crosshairs, orbits, dot-matrix glyphs, blueprint diagrams, HUD-style readouts. We pair these with editorial typography and a paper-and-ink palette to land somewhere between *Standards Manual*, *Blame!*, and a NASA technical drawing.

This document is the source of truth. When in doubt, look at the reference graphics in `design-refs/` and ask: "would this fit on the same page as those?"

---

## Principles

1. **Restraint over decoration.** When in doubt, take it out. Whitespace is a feature, not waste. If a glyph, HUD line, or label isn't doing real informational work, delete it.
2. **Monochrome first.** Black ink on warm paper. One restrained accent for emphasis, used sparingly.
3. **Line over fill.** Thin strokes, hairline rules. Solid fills only for typographic mass or buttons.
4. **Typography does the work.** Big, confident type carries each section. Mono for labels and data. Body copy stays narrow.
5. **Graphics are rare.** A page should have **one** hero glyph moment. Sections do not need glyphs to be valid. Use them for identity, not ornament.
6. **Motion is mechanical.** Tick, draw, register. No springy bounces, no parallax.

### What restraint looks like in practice

- One section label per section: `[ 02 // PROCEDURE ]`. Not three.
- No fake metadata (`BUILD ── 2026.04`, `EST. TIME ── < 5 MIN`, `SUBSYSTEMS ── 06`). Either it's real and informational, or it's not there.
- No `[ 01 ]` corner indices on every card. The list is already numbered by position.
- No `REF ── 0xFFNN` decorative footers. Numbers without referents are noise.
- No "── END TRANSMISSION ──" sign-offs. The page ending speaks for itself.
- A hairline rule and a label is enough — you don't need both a glyph and a number and a HUD line.

---

## Palette

A two-color system with one accent. No gradients. No glow.

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0A0A0A` | All text, all linework, all glyphs |
| `--paper` | `#F4F1EA` | Page background — warm off-white |
| `--paper-2` | `#EBE7DD` | Card / panel background, one step darker |
| `--rule` | `#0A0A0A` at 12% | Hairline rules, grid lines |
| `--ash` | `#6B6660` | Secondary text, captions, metadata |
| `--accent` | `#E2462E` | Vermillion — for status pips, "live" indicators, single emphasized words. Never for body text or large fills. |

### Dark mode (optional, for sections)
Inverted: `--ink: #F4F1EA`, `--paper: #0A0A0A`. Glyphs flip to white via `mask-image`.

---

## Typography

Two families, both from Google Fonts, loaded via `next/font`.

| Role | Family | Weight | Tracking |
|---|---|---|---|
| Display / headline | **Space Grotesk** | 500–700 | `-0.02em` |
| Body / UI | **Space Grotesk** | 400–500 | `0` |
| Mono / data / labels | **JetBrains Mono** | 400–500 | `0`, often `uppercase` with `0.08em` tracking |

### Scale
```
display-xl  clamp(3.5rem, 8vw, 7rem)   // hero
display-lg  clamp(2.5rem, 5vw, 4.5rem) // section openers
display-md  2.25rem                    // subsection
h1          1.875rem
h2          1.5rem
body        1rem (16px), leading 1.6
caption     0.75rem mono uppercase, tracking 0.08em
micro       0.6875rem (11px) mono uppercase
```

Body copy stays narrow — `max-w-[60ch]`. Long-form prose is set in Space Grotesk regular at 1.0625rem.

### Voice in type
- **Section labels** are mono, uppercase, bracketed: `[ 02 // ARCHITECTURE ]`
- **Metadata** uses the HUD pattern: `UPTIME ── 18:42 // LOAD ── 13%`
- **Em-dashes are typographic**: `──` (box drawing) for technical readouts, `—` (em dash) for prose

---

## Layout & Grid

- **12-column grid**, 24px gutters at md, 32px at lg+
- **Page padding**: 24px mobile, 48px tablet, 80px desktop
- **Max content width**: 1280px (`max-w-7xl`)
- **Section rhythm**: 96px / 144px / 192px vertical between sections (sm/md/lg)
- **Baseline**: 8px grid

Pages should expose their construction. Use:
- A faint dot or line grid in the background of feature sections
- Small registration marks (crosshairs) in section corners
- Numbered section labels in the top-left of each section

---

## Iconography & Glyphs

The Micrographics library lives in `public/micrographics/` (mirrored from `design-refs/`). Three categories:

| Folder | Use |
|---|---|
| `components/` | Diagrams, instruments, schematic elements. Hero-scale or accent. |
| `noneditable/` | Pre-laid HUD readouts, signal panels. Use as-is for atmosphere. |
| `editable/` | Same as noneditable but text-editable in source. We use them as-is on the web. |

Render via the `<Glyph />` component:
```tsx
<Glyph set="components" id={130} size={400} tone="ink" />  // black on paper
<Glyph set="components" id={130} size={400} tone="paper" /> // white on dark sections
```

### Rules
- **One per page.** The Hero owns the glyph moment. Other sections earn a glyph only when it's informational (a system diagram, a status indicator) — never for decoration.
- **Never recolor** to non-system colors. Ink, paper, or accent only. Use `tone="current"` to inherit a parent's text color (for hover-flipping cards).
- **Never stretch.** Glyphs are square or rectangular at their native ratio; respect it. Use percentage `size` so they scale with their container.
- **No shadows, no glow, no rotation tricks.** Static placement, occasional slow rotation for orbit-style components only.

---

## Components

### Buttons
Two variants — both rectangular, no rounded corners, hairline border.

- **Primary**: `border-ink bg-ink text-paper`, mono uppercase label, 0.5rem padding y, 1.25rem padding x. On hover: invert.
- **Secondary**: `border-ink bg-transparent text-ink`. On hover: `bg-ink text-paper`.
- **Optional pip**: a small `●` in `--accent` next to the label for "live" / primary actions.

### Cards / Panels
- `bg-paper-2`, `border border-rule`, square corners
- Top-left: small mono label `[ 01 ]` aligned with section number
- Optional crosshair registration mark in top-right corner (16px Micrographic)

### Section Header
```
[ 02 // ARCHITECTURE ] ────────────────────────────────────
                                            ┌─ glyph ─┐
Big Display Headline                        │   ✱    │
Optional kicker in mono                     └────────┘
```

### Tag / Badge
Mono, uppercase, hairline border, square. No fill (or `--paper-2` fill). Optional accent pip.

---

## Motion

All durations 200–800ms. Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` (mechanical settle).

Permitted motions:
- **Draw-on**: stroke-dashoffset reveal of line work (1s, on-scroll-once)
- **Tick fade**: opacity 0→1 with a 60ms stepped delay between siblings
- **Register**: a glyph "snaps" to its grid position (translate from 4px offset, 200ms)
- **Slow orbit**: 60s+ rotation for orbital glyphs only
- **Accent pulse**: the `--accent` pip can pulse opacity 0.6→1 at 2s, but only one per viewport

Forbidden: parallax, blur transitions, spring/bouncy easing, decorative hover scaling, gradient shifts.

`prefers-reduced-motion` collapses all animations to instant.

---

## Voice & Copy in UI

Where copy and design intersect:
- Section numbers are zero-padded: `01`, `02`, `03`
- Status uses HUD voice: `STATUS // ONLINE`, `SECTORS // 12 ACTIVE`
- Empty states use technical placeholder: `── NO SIGNAL ──`
- Footnotes are bracketed and mono: `[ ref. 0xFF01 ]`

This is sparingly applied — never to user-facing primary copy, only to chrome and metadata.

---

## What this replaces

The previous design (dark zinc bg, cyan/violet gradients, Inter, generic SaaS) is being fully retired. No glow, no gradient mesh, no neon accent colors. If you find yourself reaching for `bg-cyan-500/20` or `blur-3xl`, you're on the wrong page — come back here.

---

## File map

```
services/website/
├── DESIGN.md                          ← this file
├── design-refs/                       ← source library, do not ship
└── public/micrographics/              ← curated, web-served subset
    ├── components/                    ← from "Components Library/SVG"
    ├── noneditable/                   ← from "Non-Editable Text/SVG..."
    └── editable/                      ← from "Editable Text/SVG..."
```

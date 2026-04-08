# Data Brutalist - Slide Design System

This document defines the visual language, tokens, and component library
used across all slide decks built with the Slide Builder.

---

## 1. Philosophy

**Data Brutalist** is a presentation aesthetic that values clarity over decoration.
White backgrounds, monospaced labels, generous whitespace, and a single accent
color. Every element earns its place by communicating information, not by
filling space.

Core principles:

- High contrast, low noise
- Monochrome base with a single accent
- Structured hierarchy through typography, not color
- Cards and grids over bullet points
- Absolute positioning inside a fixed 960 x 540 canvas

---

## 2. Design Tokens

All tokens are declared as CSS custom properties on `:root`.

### Colors

| Token         | Value     | Usage                                |
|---------------|-----------|--------------------------------------|
| `--bg`        | `#ffffff` | Slide background                     |
| `--text`      | `#111111` | Primary text                         |
| `--muted`     | `#555555` | Secondary text, descriptions         |
| `--dim`       | `#999999` | Tertiary text, meta, timestamps      |
| `--border`    | `#e0e0e0` | Card borders, dividers               |
| `--accent`    | `#006039` | Primary accent ("Rolex green")       |
| `--accent-lt` | `#e6f0eb` | Accent backgrounds, highlights       |
| `--card-bg`   | `#fafafa` | Card and cell backgrounds            |
| `--red`       | `#b91c1c` | Negative / pain / danger             |
| `--red-lt`    | `#fef2f2` | Light red backgrounds                |

### Extended Palette (for multi-level systems)

These are used for maturity levels, column colors, etc:

| Name    | Value     | Usage                   |
|---------|-----------|-------------------------|
| green   | `#006039` | L1 / primary / success  |
| blue    | `#1d4ed8` | L2 / secondary          |
| purple  | `#7c3aed` | L3 / tertiary           |
| slate   | `#475569` | L4 / muted              |

### Typography

| Token            | Value                        | Usage            |
|------------------|------------------------------|------------------|
| `--font-heading` | `'Syne', sans-serif`         | Slide titles, h1 |
| `--font-body`    | `'Space Grotesk', sans-serif`| Body text, labels|
| `--font-mono`    | `'DM Mono', monospace`       | Codes, tags, meta|

---

## 3. Canvas

All slides share a fixed canvas:

- **Width**: 960px
- **Height**: 540px (16:9 ratio)
- **Background**: `var(--bg)` white
- **Overflow**: hidden
- **Position**: relative (all children use absolute positioning)

In presentation mode, the canvas is centered on a black background
and scaled proportionally with `transform: scale()` to fit the viewport.

---

## 4. Reusable Atoms

### Section Label
```css
.section-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 3px;
}
```
Placement: top-left of the slide (typically `top: 32px; left: 48px`).

### Slide Title
```css
.slide-title {
  font-family: var(--font-heading);
  font-weight: 800;
  color: var(--text);
  line-height: 1.3;
  letter-spacing: -0.01em;
}
```
Font sizes vary by slide type: 38px for hero, 24-30px for content slides.

### Accent Line
A horizontal bar for visual separation:
```css
.accent-line {
  width: 48px;
  height: 4px;
  background: var(--accent);
}
```

### Accent Bar Left
Full-height left edge bar on hero slides:
```css
.accent-bar-left {
  position: absolute;
  left: 0; top: 0;
  width: 6px;
  height: 100%;
  background: var(--accent);
}
```

### Dot Grid
Decorative grid of small dots for visual texture:
```css
.dot-grid {
  position: absolute;
  display: grid;
  gap: 14px;
}
.dot-grid .dot {
  width: 4px; height: 4px;
  border-radius: 50%;
  background: var(--border);
}
```
Generated via JS by specifying column and row counts.

### Slide Number
```css
.slide-number {
  position: absolute;
  bottom: 12px; right: 20px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--dim);
}
```

---

## 5. Component Library

### Pain Card
Red-bordered card used for problem statements:
```html
<div class="pain-card">
  <i data-lucide="icon-name"></i>
  <span>Description text</span>
</div>
```
- Grid layout: `grid-template-columns: 1fr 1fr`
- Left border: 4px solid `var(--red)`
- Icon: 26px, `var(--red)`

### Challenge Card (numbered list)
Numbered list of challenges with red left border:
```html
<div class="ch-card">
  <div class="ch-num">01</div>
  <div class="ch-body">
    <div class="ch-title">Title</div>
    <div class="ch-desc">Description with <a>links</a></div>
  </div>
</div>
```
- Vertical stack with `gap: 8px`
- Left border: 3px solid `#dc2626`
- Links: dotted underline in accent color

### Card Column (agenda style)
Grouped cards with colored headers:
```html
<div class="card-col" data-color="green">
  <div class="card-col-header">Header</div>
  <div class="card-item">
    <div class="card-num">1</div>
    <div class="card-text">
      <div class="card-label">Label</div>
      <div class="card-sub">Sublabel</div>
    </div>
  </div>
</div>
```
Color options: `green`, `blue`, `amber` (actually purple), `slate`.

### Architecture Box
Used for system architecture diagrams:
```html
<div class="arch-box frontend">Label<div class="arch-box-sub">Sublabel</div></div>
```
Variants: `.frontend` (blue), `.apic` (green), `.mock` (dashed blue),
`.ace` (yellow), `.ace-conn` (amber), `.backend` (black), `.backend-mock` (dashed green).

### Flow Lane
Horizontal timeline comparing workflows:
- `.lane.code-first` - red themed
- `.lane.contract-first` - green themed
- Contains `.flow-node` circles with icons, labels, and week markers
- `.flow-connector` arrows between nodes
- `.parallel-group` for concurrent work

### Hub Diagram (satellite pattern)
Center node with radiating satellite nodes connected by dashed SVG lines.
- `.hub-center` - accent-colored center box
- `.sat-node` - positioned with inline `style="left:X%;top:Y%"`
- SVG lines drawn via JS from center to each satellite

### Maturity Model (concentric rings)
Nested circular rings with positioned capability dots:
- `.mc-ring.r1` through `.r4` (outer to inner)
- `.mc-dot` - positioned absolutely on the rings
- `.mc-tip` - tooltip on hover (auto-flips with `.tip-left`)
- `.mc-legend` - side panel with grouped capability lists

### Data Table
Standard table for role comparisons:
- Header: accent background, white text, mono font
- Alternating row backgrounds
- First column: mono font, accent color
- Second column: muted (the "before")
- Third column: bold (the "after")

### CI/CD Item
Status-tagged cards for pipeline stages:
```html
<div class="cicd-item">
  <div class="cicd-status ready">&#9679;</div>
  <div class="cicd-body">
    <div class="cicd-title"><a>Title</a></div>
    <div class="cicd-desc">Description</div>
    <div class="cicd-links"><a>Link</a></div>
    <div class="cicd-tag ready">READY</div>
  </div>
</div>
```
Status variants: `.ready` (green), `.wip` (blue), `.planned` (grey).

---

## 6. Iconography

Icons are loaded from the Lucide icon library via UMD bundle:
```
https://unpkg.com/lucide@latest/dist/umd/lucide.min.js
```

Usage in HTML:
```html
<i data-lucide="icon-name"></i>
```

Icons are initialized in JS with `lucide.createIcons()`.

Rules:
- Monochrome only (inherit color from parent)
- Standard stroke-width: 1.75-2
- Size set via CSS (typically 12-26px depending on context)
- Never use emoji as primary icons

---

## 7. Presentation Mode

Presentation mode is triggered by pressing `F` and uses:

- Black background (`#000`)
- Fixed 960x540 slide, centered
- Proportional scaling via `transform: scale(Math.min(scaleX, scaleY))`
- Arrow keys for navigation
- `Esc` to exit
- Fullscreen API integration

This approach preserves aspect ratio on any screen size without distortion.

---

## 8. Spacing Conventions

| Context                  | Value  |
|--------------------------|--------|
| Slide padding (content)  | 48px left/right, 32px top |
| Card gap                 | 10-16px |
| Grid gap                 | 14px   |
| Section label to title   | ~24px  |
| Title to content          | ~40px  |
| Bottom margin (numbers)  | 12px from bottom |

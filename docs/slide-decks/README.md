# Slide Deck

The presentation deck for the contract-first demo, built as single-file HTML slides using a Data Brutalist design system. The deck is rendered into [`output/`](output/) by a Python build pipeline driven by [`config.yaml`](config.yaml).

## What lives here

| Path | Purpose |
|---|---|
| [`api-first-demo-structure.md`](api-first-demo-structure.md) | Presentation & delivery guide — narrative arc, slide outline, talking points, video recording plan, follow-up strategy |
| [`config.yaml`](config.yaml) | Build pipeline config — which partials to stitch, output paths, theme |
| [`context/brief.md`](context/brief.md) | Presentation brief — audience, goals, success criteria |
| [`design/design-system.md`](design/design-system.md) | Data Brutalist design language — tokens, components, typography |
| [`design/styles.css`](design/styles.css), [`design/script.js`](design/script.js) | Compiled CSS + JS used by every slide |
| [`output/`](output/) | Built output: full deck, individual slides, prototypes, archive |
| [`templates/`](templates/) | Templates for new briefs and design systems — copy and customize |

## Where to start

| If you want to... | Go to |
|---|---|
| Understand the presentation goals and audience | [`context/brief.md`](context/brief.md) |
| Read the narrative arc and talking points | [`api-first-demo-structure.md`](api-first-demo-structure.md) |
| See the live deck | [`output/slide-deck/presentation.html`](output/slide-deck/presentation.html) |
| Learn the design language | [`design/design-system.md`](design/design-system.md) |

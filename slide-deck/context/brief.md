# Presentation Brief

---

## 1. Summary

This presentation introduces an API-first, contract-first workflow to an
enterprise IT department currently running an IBM integration stack (APIC,
ACE, CP4i). It demonstrates how a single OpenAPI spec can drive mocking,
code generation, linting, testing, documentation, and CI guardrails,
replacing the manual, sequential approach that currently blocks teams for
weeks.

---

## 2. Goal

**Primary goal**: Convince the IT department that contract-first is
practical on their IBM stack today, and get buy-in to pilot the approach
on a real API within 30 days.

**Secondary goal**: Show a credible maturity path from quick wins (mocks,
linting, AI-assisted spec design) all the way to full CI/CD and a schema
registry, so the audience sees this as an investment, not a one-off demo.

---

## 3. Audience

| Attribute            | Description                                                       |
|----------------------|-------------------------------------------------------------------|
| **Who**              | IT department: backend devs, frontend/integration team devs, QA engineers, DevOps, tech leads, product owners, security |
| **Technical level**  | Mixed: developers are technical, POs and management are not       |
| **Familiarity**      | Some context on APIs, but most have never worked contract-first. Familiar with IBM tooling (ACE Toolkit, APIC portal) |
| **Decision power**   | Influences decision. Final approval likely from IT leadership after the session |
| **Size**             | Small group (5-15 people, department-level meeting)               |

---

## 4. Tone & Style

| Dimension       | Choice                                                    |
|-----------------|-----------------------------------------------------------|
| **Formality**   | Professional but approachable, not corporate-stiff        |
| **Energy**      | Confident, pragmatic, grounded in real constraints         |
| **Perspective** | First person ("I'll show you", "we can") shifting to "we" for next steps |
| **Humor**       | Light touches in the pain points slide, otherwise straight |

**Use**: concrete tool names (Spectral, Prism, Hurl, Schemathesis, Scalar, oasdiff, ZAP), real IBM product names (ACE, APIC, CP4i, BAR files), "contract", "spec", "openapi.yaml", plain language for non-dev slides

**Avoid**: buzzword overload, "digital transformation", "synergy", "leverage" as a verb, overpromising on IBM limitations

---

## 5. Key Messages

1. The OpenAPI spec is the single source of truth: write it first, generate everything else.
2. Teams stop blocking each other because mocks, docs, and tests exist from day one.
3. This works on the IBM stack today, with real constraints acknowledged and worked around.
4. There is a clear maturity path from quick wins (L1) to full automation (L4), and each level adds value independently.
5. The next step is concrete: pick a pilot API, clone the scaffold repo, start building.

---

## 6. Slide-by-Slide Outline

| #  | Working title              | Purpose                                                              |
|----|----------------------------|----------------------------------------------------------------------|
| 1  | Title                      | Set the hook: "One Contract, Everything Generated"                   |
| 2  | Disclaimer                 | Frame expectations: this is a simple demo, not the enterprise reality yet. We discuss and adapt after. |
| 3  | Wall of Pain               | Build empathy: list the daily frustrations everyone recognizes (blocked teams, stale docs, credential hunting, Postman chaos) |
| 4  | Code First vs Contract First | Visual comparison: 7 weeks sequential vs 3 weeks parallel           |
| 5  | The Shift (hub diagram)    | Show the spec at the center, with all tools radiating from it        |
| 6  | Demo Agenda                | Preview the 10 demo steps grouped by phase (design, generate, test, ship) |
| 7  | IBM Challenges             | Be honest about what's tricky on the IBM stack (manual import, scaffolding limits, OAS 3.0 restrictions, desktop toolkit, no official CI/CD) |
| 8  | IBM Architecture           | Show where contract-first fits in the IBM integration layer (DEV/QA vs PROD, mock server, ACE adapter/connector, APIC gateway) |
| 9  | ACE CI/CD                  | Concrete pipeline steps: what's ready, what's in progress, what's planned |
| 10 | Maturity Model             | Concentric rings showing 13 capabilities across 4 levels, with tooltips explaining each one |
| 11 | Role Impact                | Table showing before/after for every role (frontend, backend, QA, DevOps, security, tech lead, PO, new member) |
| 12 | Next Steps                 | Three time-boxed actions (30 days, 1 quarter, now) + repo link + "Questions?" |

---

## 7. Content & Data Sources

- scaffold-api repo (the live demo codebase)
- IBM documentation for ACE, APIC, CP4i (links embedded in challenge cards)
- Community tools: ace-maven-plugin, ace-demo-pipeline, cloudpak-gitops
- Tool docs: Spectral, Prism, Schemathesis, Hurl, oasdiff, Scalar, ZAP
- Ivan Slavka's article on ACE polymorphism limitations
- CROZ article on ACE v12 web editor
- IBM Redbook: Accelerating Modernization with Agile Integration
- PRD for the mapping IDE OSS project (uploaded document)
- contract-first-maturity-model.md (comprehensive markdown in the repo)

---

## 8. Constraints

| Constraint         | Value                                                  |
|--------------------|--------------------------------------------------------|
| **Max slides**     | 12                                                     |
| **Duration**       | 30-45 minutes (presentation) + open discussion after   |
| **Format**         | Widescreen 16:9 (960x540 canvas)                      |
| **Language**       | English                                                |
| **Branding**       | Data Brutalist design system (see design/design-system.md) |
| **Distribution**   | Shared as a single self-contained HTML file via Teams  |
| **Accessibility**  | No specific requirements beyond readable font sizes    |

---

## 9. Open Questions

- None remaining. All capabilities have been prioritized and placed into maturity levels through conversation.

---

## Checklist Before Building

- [x] Summary is written (section 1)
- [x] Goal is defined and specific (section 2)
- [x] Audience is described (section 3)
- [x] Tone is set (section 4)
- [x] At least 3 key messages listed (section 5)
- [x] Content sources linked if available (section 7)
- [x] Constraints filled in (section 8)

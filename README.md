# API-First Contract-First Scaffold

A working example of contract-first API development. One OpenAPI spec is the source of truth — mocks, clients, server stubs, tests, docs, and CI checks are all generated from it. Frontend, backend, QA, and DevOps unblock each other from day one.

## The three trees

| Tree | Purpose |
|---|---|
| [`scaffold-api/`](scaffold-api/) | The reusable scaffold itself. Clone this directory into your own repo to start a new contract-first project. Documents prerequisites, folder structure, and every `npm` script. |
| [`docs/`](docs/) | Project documentation: how-to guides, reference catalogs, product specs, and execution plans. Start at [`docs/README.md`](docs/README.md). |
| [`slide-deck/`](slide-deck/) | The presentation deck (Data Brutalist HTML slides), the demo delivery guide, and the slide build pipeline. |

## Where to start

| If you want to... | Go to |
|---|---|
| **Use the scaffold** to ship an API | [`scaffold-api/README.md`](scaffold-api/README.md) — quickstart, prereqs, scripts |
| **Understand the WHY** (problem, philosophy, goals) | [`docs/product-specs/0001_prd_api-first-scaffold.md`](docs/product-specs/0001_prd_api-first-scaffold.md) — full problem statement |
| **Find the guide for your role** (frontend, backend, QA, DevOps) | [`docs/guides/README.md`](docs/guides/README.md) |
| **Try it in 10 minutes** with copy-paste curl | [`docs/guides/manual-smoke-test.md`](docs/guides/manual-smoke-test.md) |
| **Present this to your team** | [`slide-deck/api-first-demo-structure.md`](slide-deck/api-first-demo-structure.md) — narrative arc, slide outline, talking points |

## What problem this solves

Teams work in silos. Frontend waits weeks for backend endpoints. QA hand-maintains Postman collections that drift from reality. Confluence docs nobody trusts. Inconsistent API shapes across squads. Breaking changes shipped on Friday. Onboarding takes weeks.

Contract-first makes one OpenAPI file the single source of truth. Everything downstream is generated. The full problem statement and goals live in the [PRD](docs/product-specs/0001_prd_api-first-scaffold.md).

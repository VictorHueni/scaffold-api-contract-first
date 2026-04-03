# API-First Demo: Presentation & Delivery Guide

This document covers everything non-technical about delivering the API-first demo: narrative structure, slide requirements, video recording plan, scripted talking points, and follow-up strategy. For the technical implementation, see the [exec plan](exec-plans/active/0001_exec_api-first-scaffold.md) and [PRD](product-specs/0001_prd_api-first-scaffold.md).

---

## Narrative Arc

**Opening hook (2 min):** Start with a "wall of pain" slide. List real problems the team has faced: frontend blocked by backend, QA testing against stale specs, docs nobody trusts, credentials shared in Slack, inconsistent API shapes across squads. Ask the audience to raise hands if they've lived through any of these. Then say: "Every single one of these disappears with one shift in how we work."

**Core thesis:** One contract file drives everything. Mocks, clients, stubs, tests, docs, security checks, gateway config, monitoring. Write it once, generate the rest. Every role starts working on day one.

**Closing:** Side-by-side timeline. Traditional approach vs API-first. Show how parallel work compresses delivery by weeks. End with: "One contract. Everything else is generated."

---

## Slide Deck Outline

Prepare these slides before recording. Use a clean, dark-themed design. Marp (markdown slides) or a simple Keynote/PowerPoint deck works.

### Slide 1: Title

- "API-First: One Contract, Everything Generated"
- Subtitle: "A demo for [your department name]"
- Your name and date

### Slide 2: Wall of Pain

A two-column layout or a bullet list of real problems. Make it personal to your team:

- Frontend blocked for 2 weeks waiting on backend endpoints
- QA's Postman collection doesn't match the live API
- A Confluence page says the field is `userName`, the API returns `username`
- Credentials shared in a Slack DM, now nobody knows who has access
- A breaking change shipped on Friday, 3 consumers broke over the weekend
- New dev spent their first week just figuring out which docs to trust

### Slide 3: The Shift

- A simple diagram: one YAML file in the center, arrows pointing outward to: mocks, clients, stubs, tests, docs, CI checks, gateway config
- Text: "One file. Everything else is generated."

### Slide 4: Demo Agenda

A numbered list of what you're about to show. Use this as a roadmap slide you can return to between sections:

1. The Contract (OpenAPI spec)
2. Linting (Spectral)
3. Mock Server (Prism)
4. Client Code Generation
5. Backend Server Stubs
6. Contract Testing (Schemathesis)
7. Breaking Change Detection (oasdiff)
8. API Documentation (Scalar)
9. API Documentation & Exploration (Scalar + "Try it out")
10. Functional Tests (Hurl)
11. CI Pipeline (GitHub Actions)
12. IBM Stack Integration (slides)
13. The Payoff (Role Impact Matrix)

### Slides 5-7: IBM Stack + AsyncAPI

Since IBM and AsyncAPI are slides-only (no live demo), prepare 3 slides:

**Slide 5: API Connect + Developer Portal**
- Show the `apic products:publish` command (screenshot or text)
- Screenshot or mockup of the Developer Portal showing the Order Management API
- Bullet: "Same spec file, published to the gateway with one command"
- Bullet: "Developer Portal auto-generates docs, subscription management, and API keys"

**Slide 6: App Connect**
- Screenshot or mockup of App Connect Designer importing the OpenAPI spec
- Show the operations pane listing all endpoints
- Bullet: "Operations are scaffolded as integration flows from the same spec"

**Slide 7: AsyncAPI — What's Next for Events**
- Brief explanation: "AsyncAPI is the OpenAPI equivalent for event-driven APIs — Kafka topics, MQ queues, MQTT channels"
- Show a simple AsyncAPI spec snippet (order/created channel with a typed payload)
- Side-by-side comparison: OpenAPI `paths` → AsyncAPI `channels`, `get/post` → `send/receive`
- Bullet: "Same contract-first philosophy, applied to message queues and event streams"
- Bullet: "The tooling ecosystem is maturing — documentation, linting (Spectral), and code generation are available today. Mocking and runtime validation are catching up."
- Bullet: "HDI Global SE (insurance) already uses AsyncAPI alongside OpenAPI for their API catalog"
- This is a "what's next" slide, not a "we're doing this now" slide

### Slide 8: Timeline Comparison

Two timelines side by side:

**Traditional approach:**
```
Week 1-2: Backend builds API
Week 3:   Frontend starts, finds mismatches
Week 4:   QA writes Postman collection by hand
Week 5:   Docs written in Confluence
Week 6:   Integration bugs found
Week 7:   Fixes, re-testing, re-documenting
```

**API-first approach:**
```
Day 1:    Contract written and reviewed by all roles
Day 1:    Frontend starts with mocks, backend starts with stubs
Day 1:    QA has auto-generated tests and Bruno collection
Day 1:    Docs are auto-generated and always current
Week 2-3: Backend fills in business logic
Week 3:   Integration — contract tests already passing
```

### Slide 9: Role Impact Matrix

| Role | Without API-First | With API-First |
|---|---|---|
| **Frontend Dev** | Blocked until backend is ready, guesses field names | Works from day one with mocks and typed clients |
| **Backend Dev** | Builds API shape by gut feeling, breaks consumers | Implements against a validated contract |
| **QA Engineer** | Maintains API collections by hand, tests late | Auto-generated contract tests in CI, Hurl assertions in pipeline, import spec into any client |
| **DevOps** | Configures gateway manually, manages env sprawl | Gateway imports spec, environments declared centrally |
| **Security** | Reviews after deployment, expensive fixes | Scans the spec before code exists |
| **Tech Lead** | Polices conventions in code review, inconsistency creeps in | Spectral enforces standards automatically |
| **Product Owner** | Reads code to understand the API | Reviews a visual spec, no code needed |
| **New Team Member** | Reads scattered docs and Slack threads | Reads the spec and generated docs, productive in hours |

### Slide 10: What's Next

- Proposed follow-up actions (see [Follow-Up Strategy](#follow-up-strategy) below)
- Link to the scaffold repo
- "Questions?"

---

## Video Recording Plan

### Recording Setup

**Screen resolution:** 1920x1080 or 2560x1440. Record at native resolution.

**Recording software:** OBS Studio (free, open source). Test it the day before recording.

**Terminal setup:**
- Dark theme (consistent with the demo aesthetic)
- Font size 16pt minimum so it is readable when compressed
- Clear the terminal between sections
- Use a shell prompt that shows the current directory
- Pre-populate your terminal history with all demo commands so you can arrow-up instead of typing live — this avoids typos on camera

**Browser setup:**
- Disable browser extensions that add visual clutter
- Use an incognito window for a clean UI
- Bookmark the local URLs: `http://localhost:4010` (Prism mock), `http://localhost:8080` (stub server), `http://localhost:8081` (Scalar docs with "Try it out")

**Slide tool:** Marp (markdown-to-slides, free) or Keynote/PowerPoint. Keep slides minimal — dark background, large text.

### Recording Sequence

Record each section as a **separate video file**. This lets you re-record a single section without redoing everything. Name files sequentially: `01-problem.mp4`, `02-contract.mp4`, etc.

**General tips:**
- Pause for 2 seconds after each command before showing the result. This gives viewers time to read.
- Keep a script or notes on a second screen. Do not read them verbatim — use them as a guide.
- If a command takes time, cut the wait in editing.
- When showing code or YAML, zoom in or highlight the relevant section.

---

### Clip 1: The Problem (2 min)

**Format:** Slides only. No terminal.

**Slides used:** Slide 2 (Wall of Pain), Slide 3 (The Shift)

**Script outline:**
- "We have 4 teams. Backend builds APIs. Frontend consumes them. QA tests them. DevOps deploys them."
- "Here is what happens today:" Walk through the pain points on Slide 2. Ask the audience (or the viewer) if they've experienced these.
- Show Slide 3. "What if one file could drive all of this? That's what we're going to build today."

---

### Clip 2: The Contract (5 min)

**Format:** Editor (VS Code) showing `specs/order-api.yaml`

**What to show:**
- The `info` block — title, version, description
- The `servers` block — 4 environments (mock, dev, staging, prod). Point out: "One spec, four environments."
- The `security` block — API key and OAuth2. "Security is designed, not bolted on."
- One complete endpoint: `GET /orders/{orderId}` — parameters, responses, schema references
- Schema properties: show `type`, `format`, `example`, `x-faker` side by side. "Each property has four layers of metadata."
- `$ref` usage for schema reuse

**Key line:** "This is the single source of truth. It lives in Git. Everyone reviews it. Everything else is generated from it."

---

### Clip 3: Linting (4 min)

**Format:** Terminal + editor

**What to show:**
1. Briefly show `rules/.spectral.yaml` — point out the three layers: "We extend the OpenAPI standard rules, add OWASP security rules, and add our own organizational rules."
2. Run `spectral lint` against `specs/order-api-bad.yaml`. Show violations from all three layers:
   - **Convention:** snake_case field, missing operationId, trailing slash, missing tag
   - **Security:** HTTP server (not HTTPS), missing auth on POST, API key in query param, array without `maxItems`
   - **Quality:** empty description, inline schema, missing error response
3. "Three layers of protection. Convention, security, quality — all from the same file."
4. Fix one or two violations live in the editor. Run Spectral again. Show the count dropping.
5. "This runs in CI. A PR that violates any layer cannot merge."

**Key line:** "The OWASP rules catch security issues before code exists. The convention rules enforce consistency across 50 APIs. A new team member cannot accidentally break either."

---

### Clip 4: Mock Server (4 min)

**Format:** Terminal + browser/curl

**What to show:**
1. Start Prism in static mode: `prism mock specs/order-api.yaml --port 4010`
2. `curl` a GET endpoint. Show the response using the exact `example` values from the spec. "Static mode returns what you wrote in the spec."
3. Stop Prism. Restart in dynamic mode: `prism mock -d specs/order-api.yaml --port 4010`
4. `curl` the same endpoint twice. Show two different realistic responses. "Dynamic mode uses x-faker to generate new data every call."
5. Send an invalid POST (missing required field). Show Prism rejecting it with a proper 400 error. "The mock validates input. Frontend discovers errors before backend exists."

**Key line:** "Frontend starts building today. No backend needed. And the mock will reject bad requests the same way the real API will."

---

### Clip 5: Code Generation (3 min)

**Format:** Terminal + editor

**What to show:**
1. Run `npx openapi-typescript specs/order-api.yaml -o generated/api-types.d.ts`. Show it completing in under a second.
2. Open `generated/api-types.d.ts`. Show the typed interfaces — Order, Customer, OrderItem, ErrorResponse. Every field typed, every enum defined, every optional marker present. "One command, complete type safety."
3. Open `examples/client-usage.ts`. Show a typed API call using `openapi-fetch` — IDE autocompletion on endpoint paths, typed request params, typed response body.
4. "No generated runtime code to maintain. Just types. The spec changes, you regenerate, and the compiler tells you what broke."

**Key line:** "One command generates the types. openapi-fetch gives you a 6kb wrapper with full autocompletion. No bloated SDK, no Java dependency, no generated code to commit."

---

### Clip 6: Backend Stubs (3 min)

**Format:** Terminal + editor (IntelliJ or VS Code)

**What to show:**
1. Run `openapi-generator-cli generate -g spring --additional-properties=interfaceOnly=true,useSpringBoot3=true`. Show the command completing.
2. Open the generated `OrdersApi` interface. Show the method signatures — each one matches an operationId from the spec. "The spec wrote your interface."
3. Create `OrdersApiImpl.java` implementing the interface. Fill in `getOrder()` with a minimal hardcoded Order response.
4. Start the server: `mvn spring-boot:run`. `curl` the endpoint. Show the response.
5. "The interface is the contract. You implement it. If the spec changes, the interface changes, and the compiler tells you what broke."

**Key line:** "The backend developer's job: implement the interface. The shape, the validation, the routing — generated from the spec."

---

### Clip 7: Contract Testing (5 min)

**Format:** Terminal. This is the most impactful section — take your time.

**What to show:**
1. Start Prism. Run Schemathesis against the mock: `schemathesis run specs/order-api.yaml --base-url http://localhost:4010 --checks all --stateful=links`. Show hundreds of tests passing.
2. Introduce a deliberate bug in the stub server: change `total` from a number to a string.
3. Run Schemathesis against the stub server. Show it catching the bug with a clear schema violation message and a reproduction `curl` command.
4. Fix the bug. Run again. All passing.

**Key line:** "Schemathesis generated 1000+ tests from the spec. QA wrote zero tests. Every edge case is covered."

**Teaching point:** "Schemathesis catches what you didn't think of — it fuzzes every field, every boundary, every combination. Hurl (next section) validates what you specifically expect. They complement each other."

---

### Clip 8: Breaking Change Detection (3 min)

**Format:** Terminal + editor (diff view)

**What to show:**
1. Open `specs/order-api.yaml` and `specs/order-api-v2.yaml` side by side in diff view. Point out: renamed field, removed field, type change, new optional field.
2. Run `oasdiff breaking specs/order-api.yaml specs/order-api-v2.yaml`. Show each breaking change classified.
3. Show exit code: `--fail-on ERR` returns exit code 1. "In CI, this blocks the merge."

**Key line:** "This runs on every PR. Breaking changes require a major version bump and a migration guide. No more surprise breakages."

---

### Clip 9: Documentation & API Exploration (4 min)

**Format:** Browser + desktop client(s)

**What to show:**
1. Open the Scalar API reference in browser. Show the modern UI — dark/light toggle, endpoint navigation, code samples in multiple languages.
2. Navigate to `GET /orders/{orderId}`. Show the **example picker** — click between "Pending order", "Shipped order with tracking", "Delivered order with notes". "Three scenarios, all from the spec."
3. Click "Try it out". The request body is pre-filled from the selected example. Send it against the mock. Show the response.
4. Navigate to `POST /orders`. Show the request body example picker — "Basic order" vs "Order with multiple items and notes". Select one, send it, show the 201 response.
5. Show an error example — send a malformed request, show the 400 response with the error body matching the spec's error example.
6. (Optional) Put a screenshot of a stale Confluence doc next to the Scalar page. "Which one do you trust?"
7. **Live import demo:** Open one or two desktop clients and import `specs/order-api.yaml` on camera:
   - **Bruno:** File > Import Collection > OpenAPI V3 Import > select `order-api.yaml`. Show the generated collection with all endpoints, pre-filled request bodies.
   - **Postman:** Import > File > select `order-api.yaml`. Show the collection organized by tags. Send one request against the mock.
   - Pick whichever one or two the audience is most likely to already use. The point is to show it takes 10 seconds, not to advocate for a specific tool.
6. "The spec is the standard. Your client is your choice. Import, explore, done."

**Key line:** "These docs are never stale, and you can explore the API directly from them. Or import the spec into Bruno, Postman, Insomnia — whatever you already use. Ten seconds, full collection."

---

### Clip 10: Hurl Functional Tests (2 min)

**Format:** Terminal

**What to show:**
1. Show `tests/orders.hurl` briefly in the editor — plain text HTTP tests with assertions.
2. Run `hurl --test tests/orders.hurl`. Show all 5 tests passing.
3. Show JUnit XML output: `hurl --test --report-junit generated/hurl-results.xml tests/orders.hurl`.

**Key line:** "Hand-written assertions for business scenarios. Plain text, lives in Git, runs in CI with a single binary."

**Teaching point:** "Schemathesis catches what you didn't think of — it fuzzes every edge case. Hurl validates what you specifically expect. They complement each other."

---

### Clip 11: CI Pipeline (2 min)

**Format:** Editor showing `ci/pipeline.yaml`

**What to show:**
1. Open the pipeline file. Walk through each job: lint, breaking changes (PR-only), contract test, generate clients, generate docs.
2. Show the job dependency chain: "lint must pass before contract tests run."
3. If available, show a GitHub Actions run (screenshot or live) with all jobs green.

**Key line:** "One file changes. The pipeline runs. Everything stays in sync. No human intervention."

---

### Clip 12: IBM Stack (3-5 min)

**Format:** Slides only. No live terminal. No IBM environment required.

**Slides used:** Slide 5 (API Connect), Slide 6 (App Connect), Slide 7 (AsyncAPI)

**Script outline:**
- "The same spec that drives our open-source tooling also feeds into the IBM stack."
- Walk through API Connect publishing: "One command publishes to the gateway. The Developer Portal is auto-generated."
- Walk through App Connect import: "Operations are scaffolded as flows. Wire up a backend connector and you have integration."
- Show the AsyncAPI slide: "For MQ and event-driven APIs, the same contract-first philosophy is coming. AsyncAPI is the OpenAPI equivalent for events. The tooling is maturing — HDI Global, a German insurer, already uses it alongside OpenAPI."
- "This is our next step once the REST workflow is established."

---

### Clip 13: The Payoff (3 min)

**Format:** Slides only. No terminal.

**Slides used:** Slide 8 (Timeline Comparison), Slide 9 (Role Impact Matrix), Slide 10 (What's Next)

**Script outline:**
1. Show the timeline comparison. Walk through each week. "Traditional: 7 weeks to stable integration. API-first: 3 weeks, with parallel work from day one."
2. Show the Role Impact Matrix. Walk through each role briefly. "Frontend unblocked. Backend guided. QA automated. DevOps simplified. Security shifted left."
3. "Every discipline benefits. Everyone works from day one. Drift is impossible."
4. End with: "One contract. Everything else is generated."
5. Show Slide 9 with proposed next steps and the repo link.

---

## Editing Notes

- **Total raw recording:** roughly 40-50 minutes of clips
- **Target final video:** 35-40 minutes after cutting pauses and retakes
- **Title cards:** Add section title cards between clips. Simple text on dark background, 2 seconds each. Match the slide deck theme.
- **Command highlights:** When showing a long terminal command, zoom in or add a highlight box so viewers can read it.
- **Progress bar:** Add a progress bar or chapter markers so viewers can jump to sections they care about.
- **Export:** 1080p minimum, 30fps (fine for screen recordings).
- **Background music:** Subtle background music during slide sections only — not during terminal work, where the viewer needs to focus on commands and output.
- **Chapter markers for YouTube/SharePoint:** 0:00 The Problem, 2:00 The Contract, 7:00 Linting, 10:00 Mock Server, 14:00 Code Generation, 17:00 Backend Stubs, 20:00 Contract Testing, 25:00 Breaking Changes, 28:00 Documentation & Exploration, 31:00 Hurl Tests, 33:00 CI Pipeline, 35:00 IBM Stack, 38:00 The Payoff

---

## Companion Materials

Share these alongside the video so viewers can explore on their own:

| Material | Where | Purpose |
|---|---|---|
| Meta-repository | GitHub (internal) | Contains docs, PRDs, and both scaffold templates |
| `scaffold-api/` | Copy into your own repo | API scaffold — `npm install`, start building |
| `scaffold-api/specs/order-api.yaml` | In the scaffold | The spec itself — explore it, import it, generate from it |
| `scaffold-api/rules/.spectral.yaml` | In the scaffold | Teams can adopt the ruleset immediately |
| `scaffold-api/ci/pipeline.yaml` | In the scaffold | DevOps can evaluate and adapt for their CI |
| `scaffold-integration/` | Copy into your own repo | Integration mapping scaffold (PRD 0002, future) |
| Interactive training app | To be built post-implementation | Hands-on walkthrough of the API-first workflow (scoped after all increments are delivered) |
| Tool links | In the README or a shared doc | Prism, Spectral, openapi-generator, Scalar, Schemathesis, Hurl, oasdiff + desktop client options (Bruno, Postman, Insomnia, Hoppscotch, Yaak) |

---

## Delivery Checklist

This checklist tracks video recording and presentation delivery. The scaffold implementation is tracked separately in the [exec plan](exec-plans/active/0001_exec_api-first-scaffold.md).

### Pre-recording

- [ ] Scaffold smoke test passes end-to-end (exec plan Increment 12 complete)
- [ ] Terminal configured: dark theme, 16pt+ font, shell prompt shows current directory
- [ ] Terminal history pre-populated with all demo commands (arrow-up to recall)
- [ ] Browser configured: incognito, extensions disabled, bookmarks for localhost:4010, :8080, :8081
- [ ] OBS Studio installed and tested
- [ ] Slide deck complete (10 slides — see Slide Deck Outline above)

### Recording

- [ ] Clip 1: The Problem (2 min, slides)
- [ ] Clip 2: The Contract (5 min, editor + spec walkthrough)
- [ ] Clip 3: Linting (4 min, 3-layer Spectral demo)
- [ ] Clip 4: Mock Server (4 min, static + dynamic + validation error)
- [ ] Clip 5: Code Generation (3 min, openapi-typescript + openapi-fetch)
- [ ] Clip 6: Backend Stubs (3 min, Spring Boot interfaces)
- [ ] Clip 7: Contract Testing (5 min, Schemathesis with intentional bug)
- [ ] Clip 8: Breaking Change Detection (3 min, oasdiff)
- [ ] Clip 9: Documentation + API Exploration (4 min, Scalar + desktop client import)
- [ ] Clip 10: Hurl Functional Tests (2 min)
- [ ] Clip 11: CI Pipeline (2 min, pipeline.yaml walkthrough)
- [ ] Clip 12: IBM Stack + AsyncAPI (3-5 min, slides only)
- [ ] Clip 13: The Payoff (3 min, timeline + role impact matrix)

### Post-production

- [ ] All clips assembled in sequence with title cards (2s each)
- [ ] Pauses and retakes cut
- [ ] Progress bar or chapter markers added
- [ ] Exported at 1080p, 30fps
- [ ] Total runtime: 35-40 minutes
- [ ] Uploaded to internal platform
- [ ] Companion materials shared (repo link, spec, ruleset, pipeline, tool links)
- [ ] Q&A session scheduled

---

## Follow-Up Strategy

### Immediate (week after presentation)

- **Q&A session:** Offer a live Q&A after people have watched the video. Address concerns, answer role-specific questions.
- **Share the repo:** Make sure everyone has access and knows where it is.
- **Collect feedback:** Short survey — "Which phase was most relevant to your role? What questions remain?"

### Short-term (30 days)

- **Pick a pilot API:** Choose one real, low-risk, medium-complexity API to adopt the API-first workflow. This validates the approach without excessive risk.
- **Adopt Spectral:** Set up the shared Spectral ruleset for the pilot project. Consider publishing it as an npm package so all repos can depend on one versioned ruleset.
- **Evaluate Prism:** Establish Prism as the standard mock server for the pilot team.
- **Integrate Schemathesis into CI:** Add contract testing to the pilot project's pipeline.

### Medium-term (1 quarter)

- **Hands-on workshop:** Schedule a session where each discipline tries the tools on their own machine. Frontend generates a client. Backend generates stubs. QA runs Schemathesis. DevOps reviews the pipeline.
- **Expand to more APIs:** If the pilot succeeds, roll out to 2-3 more projects.
- **Internal API catalog:** Evaluate Backstage or a similar tool to aggregate all API specs in one place.
- **Measure results:** Compare integration bug rates, onboarding time, and documentation trust between API-first and traditional projects (see PRD success metrics).

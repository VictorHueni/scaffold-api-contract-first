# Tech Debt Tracker

Tracks known technical debt, deferred upgrades, and unresolved vulnerabilities.

Last reviewed: 2026-04-07

---

## 1. Outdated packages

### @scalar/cli — pinned at 1.3.2 (latest: 1.8.3)

- **Why:** Versions 1.4.0+ require Node >= 24. Project currently runs Node 22.
- **Impact:** Missing newer Scalar features and bug fixes.
- **Resolution:** Upgrade once the project moves to Node 24+. Note that 1.8.3 introduces new transitive vulnerabilities (hono, fastify, undici, vite) — reassess audit impact at upgrade time.

### @openapitools/openapi-generator-cli — pinned at 0.0.6 (latest: 2.31.0)

- **Why:** Version 2.31.0 introduces 3 new vulnerabilities via its `@nestjs/core` dependency (`path-to-regexp` ReDoS, NestJS injection).
- **Impact:** Using a very old CLI wrapper. The underlying OpenAPI Generator JAR is fetched at runtime and is not affected.
- **Resolution:** Monitor for a release that fixes the `@nestjs/core` transitive dependency chain.

---

## 2. Unresolved npm audit vulnerabilities

As of 2026-04-07: **21 vulnerabilities** (0 critical, 13 high, 6 moderate, 2 low). All are in devDependencies — no production exposure.

### lodash <= 4.17.23 — Prototype Pollution (high, 5 instances)

- **Source:** `@stoplight/spectral-core`, `spectral-cli`, `spectral-functions`, `spectral-rulesets`, `postman-collection`
- **Advisories:** GHSA-xxjr-mmjv-4gpg, GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh
- **Status:** No fix available. Stoplight ecosystem hard-depends on `lodash ~4.17.23`.

### minimatch <= 3.1.3 — ReDoS (high, 1 instance)

- **Source:** `@stoplight/spectral-core`
- **Advisories:** GHSA-3ppc-4f35-3m26, GHSA-7r86-cg39-jmmj, GHSA-23c5-xmqv-rm74
- **Status:** No fix available. `spectral-core` pins `minimatch 3.1.2`.

### rollup < 2.80.0 — Path Traversal (high, 1 instance)

- **Source:** `@stoplight/spectral-ruleset-bundler`
- **Advisory:** GHSA-mw96-cpmx-2vgc
- **Status:** Bundled inside Spectral. No upgrade path.

### @tootallnate/once — Incorrect Control Flow (low, 1 instance)

- **Source:** `@stoplight/prism-http` via `http-proxy-agent@5`
- **Advisory:** GHSA-vpq2-c234-7xj6
- **Status:** Locked inside `prism-cli@5` dependency tree.

### fast-xml-parser 4.x–5.5.6 — Entity Expansion Bypass (moderate, 1 instance)

- **Source:** `@stoplight/prism-http-server`
- **Advisory:** GHSA-jp2q-39xq-3w4g
- **Status:** Locked inside `prism-cli@5` dependency tree.

---

## 3. Root cause

All 21 remaining vulnerabilities trace back to the **Stoplight ecosystem** (`@stoplight/spectral-*`, `@stoplight/prism-*`). These packages have not migrated off `lodash`, `minimatch@3`, or other vulnerable transitive dependencies. No version — stable or beta — resolves them.

### Mitigation

- These are **devDependencies only** (linting, mocking, docs tooling). They are never bundled or deployed to production.
- The most impactful future action is to monitor Stoplight releases or evaluate alternative tooling (e.g., replacing Prism with Microcks, WireMock, or MSW for mocking).

---

## Review cadence

Re-run `npm audit` periodically and update this file when the situation changes.

# Diagram: Traditional vs API-First Timeline

> **Usage:** Slide 7 in the presentation. Screenshot or recreate in your slide tool for best visual impact. The two Gantt charts show the same project — traditional (sequential, 7 weeks) vs API-first (parallel, 3 weeks).

## Traditional Approach (Sequential)

```mermaid
gantt
    title Traditional: Sequential Workflow (7 weeks)
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Tech Lead
    Design API verbally           :tl1, 2025-01-06, 3d

    section Backend Dev
    Build API from scratch        :be1, after tl1, 14d
    Fix integration bugs          :be2, after qa2, 5d

    section Frontend Dev
    Blocked waiting on backend    :crit, fe0, 2025-01-06, 17d
    Start building against API    :fe1, after be1, 7d
    Fix mismatches                :fe2, after qa2, 5d

    section QA Engineer
    Write Postman collection      :qa1, after fe1, 5d
    Test and find bugs            :qa2, after qa1, 5d
    Retest after fixes            :qa3, after be2, 3d

    section Product Owner
    Write docs in Confluence      :po1, after be1, 5d
    Docs already stale            :crit, po2, after fe2, 3d

    section DevOps
    Configure gateway manually    :dv1, after qa3, 3d
```

## API-First Approach (Parallel)

```mermaid
gantt
    title API-First: Parallel Workflow (3 weeks)
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Tech Lead
    Write OpenAPI spec            :tl1, 2025-01-06, 2d
    Review PR (all roles)         :tl2, after tl1, 1d

    section Frontend Dev
    Build against Prism mocks     :fe1, after tl2, 10d
    Use generated TS client       :fe2, after tl2, 10d

    section Backend Dev
    Fill in generated stubs       :be1, after tl2, 10d
    Contract tests pass locally   :be2, after be1, 2d

    section QA Engineer
    Schemathesis runs in CI       :qa1, after tl2, 1d
    Write Hurl business tests     :qa2, after tl2, 3d
    Explore via Scalar / client   :qa3, after tl2, 2d

    section Product Owner
    Review Scalar docs            :po1, after tl2, 1d
    Docs always current           :active, po2, after po1, 11d

    section DevOps
    CI pipeline active            :active, dv1, after tl2, 12d

    section Integration
    Contract tests already pass   :milestone, m1, after be2, 0d
```

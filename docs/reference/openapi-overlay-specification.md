# OpenAPI Overlay Specification Reference

A practical reference for the OpenAPI Overlay Specification, focused on how it applies to API mediation and integration mapping documentation.

**Used by:** [`0002_prd_integration-mapping-as-code.md`](../product-specs/0002_prd_integration-mapping-as-code.md)

**Specification versions:** v1.0.0 (2024-10-17), v1.1.0 (2026-01-14)

---

## What It Solves

You need to add information to an OpenAPI spec you don't own — mapping annotations, security notes, internal tags, deprecation markers — without modifying the original file. Overlays are a separate, version-controlled file that describes changes to apply to any OpenAPI spec.

---

## Document Structure

```yaml
overlay: "1.1.0"                    # Spec version (required)
info:                                # Metadata (required)
  title: "Consumer Mapping Overlay"
  version: "1.0.0"
  description: "Adds mapping annotations to the consumer API spec"
extends: "./apis/consumer-api.yaml"  # Target spec (optional, informational)
actions:                             # Ordered list of changes (required, min 1)
  - target: $.paths['/orders'].get
    update:
      x-mapping-ref: "mappings/create-order.mapping.yaml"
```

| Field | Type | Required | Description |
|---|---|---|---|
| `overlay` | string | Yes | Spec version (`"1.0.0"` or `"1.1.0"`) |
| `info` | object | Yes | `title` (required), `version` (required), `description` (optional) |
| `extends` | string | No | URI of the target OpenAPI doc. Informational — tooling can apply any overlay to any spec |
| `actions` | array | Yes | Ordered list of Action objects. Min 1 entry |

---

## Action Types

An action has a `target` (JSONPath expression) and exactly one modifier: `update`, `remove`, or `copy`.

### update — Merge, Append, or Replace

**Object + Object → deep recursive merge:**
```yaml
- target: $.paths['/orders'].get
  update:
    x-rate-limit: 100
    x-mapping-note: "Routed by region"
# Existing properties (summary, operationId, etc.) preserved
```

**Array + Array → concatenation (append, not replace):**
```yaml
- target: $.paths.*.get.parameters
  update:
    - name: X-Correlation-Id
      in: header
      required: true
# Existing parameters stay, new one appended
```

**Primitive → replacement (v1.1.0 only):**
```yaml
- target: $.paths['/orders'].get.description
  update: "Updated description text"
```

### remove — Delete Target Nodes

```yaml
# Remove an entire path
- target: $.paths['/internal-debug']
  remove: true

# Remove parameters by filter
- target: $.paths.*.get.parameters[?@.name == 'debug']
  remove: true

# Remove a schema
- target: $.components.schemas.InternalModel
  remove: true
```

Only the selected node is removed — the parent stays.

### copy — Duplicate from Elsewhere (v1.1.0 only)

```yaml
# Copy all operations from /items to /some-items
- target: '$.paths["/some-items"]'
  copy: '$.paths["/items"]'
```

Compose a **move** (rename) with 3 actions:
```yaml
- target: $.paths
  update: { "/new-path": {} }         # 1. Create target
- target: '$.paths["/new-path"]'
  copy: '$.paths["/old-path"]'        # 2. Copy content
- target: '$.paths["/old-path"]'
  remove: true                         # 3. Delete original
```

---

## Deep Merge Rules

| Source type | Update type | Result |
|---|---|---|
| Object | Object | Recursive merge — existing props preserved, new added, shared updated |
| Array | Array | Concatenated (appended) — never replaced |
| Primitive | Primitive | Replaced (v1.1.0 only) |
| Mismatched types | — | Error |

Key implications:
- `update` never removes properties — use `remove` for that
- `update` never replaces arrays — it always appends. To replace an array, `remove` first then `update`
- Properties not mentioned in `update` are untouched

---

## Targeting with JSONPath (RFC 9535)

The `target` field uses full RFC 9535 JSONPath:

| What you target | JSONPath |
|---|---|
| Root document | `$` |
| Specific path | `$.paths['/orders']` |
| Specific operation | `$.paths['/orders'].get` |
| All GET operations | `$.paths.*.get` |
| A schema property | `$.components.schemas.Order.properties.status` |
| Parameters by name | `$.paths.*.get.parameters[?@.name=='limit']` |
| All descriptions anywhere | `$..description` |
| Operations with a specific extension | `$.paths[?(@.get['x-oai-traits'][?(@ == 'paged')])].get` |
| A specific server by URL | `$.servers[?@.url=='https://staging.example.com']` |

**Zero matches → no-op** (not an error).
**Multiple matches → action applies to ALL matched nodes.**

---

## Multiple Overlays

### Within a single file
Actions apply **in sequential order**. Each action operates on the result of the previous.

### Across files
Overlays chain — output of one is input to the next:

```
base.yaml → auth.overlay.yaml → mapping.overlay.yaml → result.yaml
```

**Team separation pattern:**
- Integration team: `mapping-annotations.overlay.yaml`
- Security team: `security-notes.overlay.yaml`
- Partner-facing: `remove-internal.overlay.yaml` (strips internal endpoints before sharing)

---

## Limitations

| Limitation | Workaround |
|---|---|
| Cannot replace arrays (only append) | Remove then re-add in two actions |
| No conditional logic (if/else) | JSONPath filters provide targeting conditions, but matched actions always execute |
| No computed values or string interpolation | `copy` copies whole nodes; no arithmetic or concat |
| Cannot create parent nodes implicitly | Target the parent container and add the child in the update |
| No validation of result | Apply overlay first, then lint with Spectral |

### What overlays CAN do (common misconception)
You **can** add new paths and schemas — target the parent container:
```yaml
- target: $.paths
  update:
    '/new-endpoint':
      get:
        summary: A brand new endpoint

- target: $.components.schemas
  update:
    NewModel:
      type: object
      properties:
        id: { type: integer }
```

---

## Version Differences (v1.0.0 vs v1.1.0)

| Feature | v1.0.0 | v1.1.0 |
|---|---|---|
| `copy` action | Not available | Added |
| Target primitive nodes | Not allowed | Allowed |
| Primitive array item removal | Not possible | Possible via filter |
| `info.description` | Not defined | Added |
| Merge rules | Informal | Formally specified |
| File naming | Not specified | `purpose.overlay.yaml` recommended |

---

## How We Use Overlays (PRD 0002)

The integration repo references API specs it doesn't own (downloaded into `apis/` from `apis.lock.yaml`). Overlays annotate these specs with mapping metadata without modifying the originals:

```yaml
# overlays/consumer-mapping.overlay.yaml
overlay: 1.1.0
info:
  title: Consumer API Mapping Annotations
  version: 1.0.0
extends: ./apis/consumer-order-api.yaml

actions:
  # Annotate a field with its mapping reference
  - target: $.components.schemas.Order.properties.fullName
    update:
      x-mapping-ref: "mappings/create-order.mapping.yaml#/mappings/1"
      x-mapping-note: "Split into firstName + lastName in canonical model"

  # Annotate a transcodified field
  - target: $.components.schemas.Order.properties.status
    update:
      x-mapping-ref: "mappings/create-order.mapping.yaml#/transcodifications/0"
      x-mapping-note: "Transcodified: A->ACTIVE, I->INACTIVE, S->SUSPENDED"

  # Annotate an operation with routing info
  - target: $.paths['/orders'].post
    update:
      x-routing-ref: "mappings/create-order.mapping.yaml#/routing"
      x-routing-note: "Routed by X-Region header and orderType field"

  # Add mapping metadata to the spec info block
  - target: $.info
    update:
      x-mapping-coverage: "100% - all consumer fields mapped"
      x-canonical-model: "canonical/Order.yaml"
```

**CI pipeline applies the overlay and renders annotated docs:**
```bash
# Download spec → apply overlay → render
npx overlays-js apply apis/consumer-order-api.yaml \
  overlays/consumer-mapping.overlay.yaml \
  -o generated/consumer-order-api-annotated.yaml

npx @scalar/cli serve generated/consumer-order-api-annotated.yaml
```

Original spec stays pristine. Overlay is committed and reviewed in PRs. Annotated spec is generated.

---

## Tooling Support

| Tool | Language | Notes |
|---|---|---|
| **overlays-js** | JavaScript | Reference implementation by spec editor Lorna Mitchell |
| **Speakeasy CLI** | CLI | Can create, apply, and generate overlays from spec diffs |
| **Bump.sh CLI** | CLI | Documentation platform with overlay support |
| **openapi-format** | JavaScript | CLI + GUI for building overlays |
| **oas-overlay-java** | Java | IBM's implementation |
| **overlay-jvm** | JVM | Java/Kotlin implementation |
| **apigee-go-gen** | Go | Google Apigee tooling |
| **Specmatic** | JVM | Contract testing tool |
| **Zuplo CLI** | CLI | API gateway with overlay support |

**Notable:** Redocly CLI does NOT implement the Overlay spec. They use their own "decorators" system instead.

---

## References

- Overlay Specification v1.1.0 (latest): https://spec.openapis.org/overlay/latest.html
- Overlay Specification v1.0.0: https://spec.openapis.org/overlay/v1.0.0.html
- OAI/Overlay-Specification GitHub: https://github.com/OAI/Overlay-Specification
- OpenAPI Learning: Overlays: https://learn.openapis.org/overlay/
- RFC 9535 (JSONPath): https://www.rfc-editor.org/rfc/rfc9535
- overlays-js (reference implementation): https://github.com/lornajane/openapi-overlays-js
- Speakeasy Overlay best practices: https://www.speakeasy.com/openapi/overlays
- Bump.sh Overlay guide: https://docs.bump.sh/guides/openapi/specification/v3.1/extending/overlays/
- Zuplo Overlay guide: https://zuplo.com/docs/guides/openapi-overlays
- v1.0 to v1.1 upgrade guide: https://learn.openapis.org/upgrading/overlay-v1.0-to-v1.1.html

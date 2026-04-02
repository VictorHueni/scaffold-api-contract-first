import { useState } from "react";

const STEPS = [
  {
    id: "bare",
    label: "Bare Spec",
    subtitle: "Schema only, no examples",
    description:
      "This is what most teams start with. The schema defines types and constraints, but the mock server has nothing to work with except the raw types. Prism in static mode will return placeholder values like 'string' for every string field.",
    spec: `# Order Management API - Step 1: Bare Schema
# No examples, no faker annotations
# Prism will return: "string", 0, true

openapi: "3.1.0"
info:
  title: Order Management API
  version: 1.0.0

paths:
  /orders/{orderId}:
    get:
      summary: Get an order by ID
      operationId: getOrder
      parameters:
        - name: orderId
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: The order
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Order"

components:
  schemas:
    Order:
      type: object
      required: [id, status, customer, items, total]
      properties:
        id:
          type: string
        status:
          type: string
          enum: [pending, confirmed, shipped, delivered]
        customer:
          $ref: "#/components/schemas/Customer"
        items:
          type: array
          items:
            $ref: "#/components/schemas/OrderItem"
        total:
          type: number
        createdAt:
          type: string
          format: date-time
        notes:
          type: string

    Customer:
      type: object
      required: [id, name, email]
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
          format: email
        phone:
          type: string

    OrderItem:
      type: object
      required: [productId, name, quantity, unitPrice]
      properties:
        productId:
          type: string
        name:
          type: string
        quantity:
          type: integer
          minimum: 1
        unitPrice:
          type: number
          minimum: 0`,
    mockResponse: `// prism mock api.yaml
// GET /orders/abc123
// Prism static mode: uses type defaults

{
  "id": "string",
  "status": "pending",
  "customer": {
    "id": "string",
    "name": "string",
    "email": "user@example.com",
    "phone": "string"
  },
  "items": [
    {
      "productId": "string",
      "name": "string",
      "quantity": 0,
      "unitPrice": 0
    }
  ],
  "total": 0,
  "createdAt": "2019-08-24T14:15:22Z",
  "notes": "string"
}`,
    verdict: "Useless for frontend dev. Every string is 'string', every number is 0. A UI built against this will break the moment real data arrives.",
    verdictType: "bad",
  },
  {
    id: "format",
    label: "+ Formats & Constraints",
    subtitle: "Add format, pattern, min/max",
    description:
      "Adding JSON Schema constraints gives the mock server clues. The format keyword (email, date-time, uri, uuid) tells Prism what shape the string should have. Numeric min/max and string minLength/maxLength add realism. Prism in dynamic mode (-d flag) now generates random values within these constraints.",
    spec: `# Step 2: Add formats and constraints
# Prism dynamic mode respects these

components:
  schemas:
    Order:
      type: object
      required: [id, status, customer, items, total]
      properties:
        id:
          type: string
          format: uuid              # <-- generates a real UUID
        status:
          type: string
          enum: [pending, confirmed, shipped, delivered]
        customer:
          $ref: "#/components/schemas/Customer"
        items:
          type: array
          minItems: 1               # <-- at least 1 item
          maxItems: 5               # <-- at most 5 items
          items:
            $ref: "#/components/schemas/OrderItem"
        total:
          type: number
          minimum: 0.01
          maximum: 10000
        createdAt:
          type: string
          format: date-time         # <-- ISO 8601 date
        notes:
          type: string
          maxLength: 200

    Customer:
      type: object
      required: [id, name, email]
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
          minLength: 2
          maxLength: 50
        email:
          type: string
          format: email             # <-- generates user@domain.com
        phone:
          type: string
          pattern: "^\\\\+[0-9]{10,15}$"  # <-- E.164 format

    OrderItem:
      type: object
      required: [productId, name, quantity, unitPrice]
      properties:
        productId:
          type: string
          format: uuid
        name:
          type: string
          minLength: 3
          maxLength: 80
        quantity:
          type: integer
          minimum: 1
          maximum: 99
        unitPrice:
          type: number
          minimum: 0.50
          maximum: 999.99`,
    mockResponse: `// prism mock -d api.yaml
// GET /orders/abc123
// Prism dynamic mode: random within constraints

{
  "id": "a3b8f042-1e16-4f0e-bb43-cd4fa419e218",
  "status": "shipped",
  "customer": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Lkjsdf Ioqwer",
    "email": "xkcd123@bqwerty.com",
    "phone": "+38291045672"
  },
  "items": [
    {
      "productId": "9c4f8a2e-6b3d-4f1a-8c2e-1d3f5a7b9c0e",
      "name": "Qxz Plmok Wert",
      "quantity": 14,
      "unitPrice": 247.83
    },
    {
      "productId": "2d5e8f1a-3c6b-4d2e-9f0a-7b8c1d4e6f2a",
      "name": "Bvn Asd Hjkl",
      "quantity": 3,
      "unitPrice": 82.50
    }
  ],
  "total": 3942.17,
  "createdAt": "2024-07-14T09:23:41Z",
  "notes": "Uxyz abc qwerty ipsum dolor"
}`,
    verdict: "Better structure. UUIDs, emails, dates are valid. But the names and text are gibberish. A frontend dev can't demo this to a product owner.",
    verdictType: "meh",
  },
  {
    id: "examples",
    label: "+ Static Examples",
    subtitle: "Hand-crafted example values",
    description:
      "Adding example values at the schema or property level gives Prism perfect responses in static mode. This is ideal for demos, screenshots, and documentation. The downside: it's always the same response, so your frontend might be subtly tuned to only handle 'Marie Dupont' with exactly 2 items.",
    spec: `# Step 3: Add static examples
# Prism static mode returns these exactly

components:
  schemas:
    Order:
      type: object
      required: [id, status, customer, items, total]
      properties:
        id:
          type: string
          format: uuid
          example: "ord-20240715-001"
        status:
          type: string
          enum: [pending, confirmed, shipped, delivered]
          example: "confirmed"
        total:
          type: number
          example: 157.47
        createdAt:
          type: string
          format: date-time
          example: "2024-07-15T14:30:00Z"
        notes:
          type: string
          example: "Leave at front door"

    Customer:
      type: object
      required: [id, name, email]
      properties:
        id:
          type: string
          format: uuid
          example: "cust-8842"
        name:
          type: string
          example: "Marie Dupont"
        email:
          type: string
          format: email
          example: "marie.dupont@email.fr"
        phone:
          type: string
          example: "+33612345678"

    OrderItem:
      type: object
      required: [productId, name, quantity, unitPrice]
      # Use schema-level example for coherent objects
      example:
        productId: "prod-1001"
        name: "Wireless Bluetooth Headphones"
        quantity: 1
        unitPrice: 89.99
      properties:
        productId:
          type: string
          format: uuid
        name:
          type: string
        quantity:
          type: integer
          minimum: 1
        unitPrice:
          type: number`,
    mockResponse: `// prism mock api.yaml  (static mode)
// GET /orders/abc123
// Always returns the exact example values

{
  "id": "ord-20240715-001",
  "status": "confirmed",
  "customer": {
    "id": "cust-8842",
    "name": "Marie Dupont",
    "email": "marie.dupont@email.fr",
    "phone": "+33612345678"
  },
  "items": [
    {
      "productId": "prod-1001",
      "name": "Wireless Bluetooth Headphones",
      "quantity": 1,
      "unitPrice": 89.99
    }
  ],
  "total": 157.47,
  "createdAt": "2024-07-15T14:30:00Z",
  "notes": "Leave at front door"
}`,
    verdict: "Perfect for demos and docs. But it's frozen. Every call returns the same Marie Dupont buying the same headphones. Your frontend only ever sees one shape of data.",
    verdictType: "good",
  },
  {
    id: "faker",
    label: "+ x-faker",
    subtitle: "Dynamic realistic data",
    description:
      "Now we add x-faker annotations. Each field gets a Faker method that generates contextually appropriate random data. Names look like names, prices look like prices, product names look like products. Combined with dynamic mode, every call returns different but realistic data.",
    spec: `# Step 4: Add x-faker for dynamic realistic data
# Prism dynamic mode uses these to generate
# contextually meaningful random values

components:
  schemas:
    Order:
      type: object
      required: [id, status, customer, items, total]
      properties:
        id:
          type: string
          x-faker: string.uuid
          example: "ord-20240715-001"   # keep for docs
        status:
          type: string
          enum: [pending, confirmed, shipped, delivered]
          # enum values are picked randomly, no faker needed
        customer:
          $ref: "#/components/schemas/Customer"
        items:
          type: array
          minItems: 1
          maxItems: 5
          items:
            $ref: "#/components/schemas/OrderItem"
        total:
          type: number
          x-faker: "commerce.price({ min: 15, max: 2000 })"
        createdAt:
          type: string
          format: date-time
          x-faker: date.recent
        notes:
          type: string
          x-faker: lorem.sentence

    Customer:
      type: object
      required: [id, name, email]
      properties:
        id:
          type: string
          x-faker: string.uuid
        name:
          type: string
          x-faker: person.fullName       # "Jean Martin"
        email:
          type: string
          x-faker: internet.email        # "jean.martin@yahoo.fr"
        phone:
          type: string
          x-faker: phone.number          # "+33 6 12 34 56 78"

    OrderItem:
      type: object
      required: [productId, name, quantity, unitPrice]
      properties:
        productId:
          type: string
          x-faker: string.uuid
        name:
          type: string
          x-faker: commerce.productName  # "Ergonomic Steel Chair"
        quantity:
          type: integer
          minimum: 1
          maximum: 10
          x-faker: "number.int({ min: 1, max: 10 })"
        unitPrice:
          type: number
          x-faker: "commerce.price({ min: 5, max: 500 })"`,
    mockResponse: `// prism mock -d api.yaml  (dynamic mode + x-faker)
// GET /orders/abc123
// Call 1:

{
  "id": "e7a3c1f2-9b4d-4e6a-8f2c-3d5e7a9b1c4f",
  "status": "shipped",
  "customer": {
    "id": "b2d4f6a8-1c3e-5a7b-9d0f-2e4c6a8b0d1f",
    "name": "Jean-Pierre Martin",
    "email": "jean-pierre.martin@hotmail.fr",
    "phone": "+33 6 45 78 23 91"
  },
  "items": [
    {
      "productId": "a1c3e5b7-2d4f-6a8c-0e2b-4d6f8a0c2e4b",
      "name": "Ergonomic Steel Chair",
      "quantity": 2,
      "unitPrice": 189.99
    },
    {
      "productId": "c3e5a7b9-4f6d-8a0c-2e4b-6d8f0a2c4e6b",
      "name": "Recycled Cotton Gloves",
      "quantity": 5,
      "unitPrice": 12.50
    },
    {
      "productId": "f1d3b5a7-6c8e-0a2d-4f6b-8a0c2e4d6f8a",
      "name": "Handcrafted Wooden Table",
      "quantity": 1,
      "unitPrice": 450.00
    }
  ],
  "total": 892.49,
  "createdAt": "2024-07-14T16:42:18Z",
  "notes": "Voluptas sequi necessitatibus est."
}

// Call 2 (different data every time):

{
  "id": "1f3a5c7e-9b2d-4f6a-8c0e-2d4f6a8b0c2e",
  "status": "pending",
  "customer": {
    "id": "7a9c1e3b-5d7f-2a4c-6e8b-0d2f4a6c8e0b",
    "name": "Sophie Lefebvre",
    "email": "sophie_lefebvre42@gmail.com",
    "phone": "+33 7 91 34 56 28"
  },
  "items": [
    {
      "productId": "2b4d6f8a-0c2e-4a6b-8d0f-2a4c6e8b0d2f",
      "name": "Licensed Rubber Keyboard",
      "quantity": 1,
      "unitPrice": 34.99
    }
  ],
  "total": 34.99,
  "createdAt": "2024-07-15T08:11:03Z",
  "notes": "Aut dolorem reprehenderit nemo."
}`,
    verdict: "Every call is different, every value is realistic. A frontend dev can build real pagination, test long names, test variable item counts. A product owner can look at this and understand the API.",
    verdictType: "great",
  },
  {
    id: "full",
    label: "Full Setup",
    subtitle: "Spec + Prism + Schemathesis + Newman",
    description:
      "The complete picture. The spec with x-faker drives the mock server for frontend dev, Schemathesis generates thousands of edge-case tests from the same spec, and a Postman collection is auto-generated for QA manual exploration. All from the same file.",
    spec: `# The same spec file drives everything:

# 1. Start the mock server
prism mock -d order-api.yaml --port 4010

# 2. Frontend dev works against the mock
curl http://localhost:4010/orders/any-id
# -> realistic, different data every call

# 3. Generate Postman collection
npx openapi-to-postmanv2 \\
  -s order-api.yaml \\
  -o order-api.postman.json

# 4. Run contract tests (against mock or real API)
schemathesis run order-api.yaml \\
  --base-url http://localhost:4010 \\
  --checks all \\
  --stateful=links

# 5. Run Postman collection in CI
newman run order-api.postman.json \\
  --environment dev.postman_environment.json \\
  --reporters cli,junit

# 6. Validate real API against the spec (proxy)
prism proxy order-api.yaml \\
  https://api.staging.yourcompany.com \\
  --errors`,
    mockResponse: `# Schemathesis output (abbreviated):

=== Schemathesis test session ===
Schema: order-api.yaml
Base URL: http://localhost:4010

GET /orders/{orderId}
  . 200 OK ..................... 847 passed
  . 404 Not Found ............. 212 passed
  . Response validates schema . 1059 passed

POST /orders
  . 201 Created ............... 634 passed
  . 400 Bad Request ........... 423 passed
  . Response validates schema . 1057 passed
  X Schema violation ......... 1 FAILED
    -> "total" returned as string, expected number
    Reproduce: curl -X POST -d '{"items":[...]}' ...

PUT /orders/{orderId}
  . 200 OK .................... 512 passed
  . 404 Not Found ............. 198 passed

=== 1 failure, 4045 passed in 23.4s ===

# Newman output (abbreviated):

Order Management API
  GET /orders/:orderId
    [200] returns order ......... PASS
    response matches schema ..... PASS
    response time < 500ms ....... PASS
  POST /orders
    [201] creates order ......... PASS
    returns Location header ..... PASS

Total: 12 requests | 24 assertions
  22 passed | 2 failed`,
    verdict: "One spec file. Zero hand-written tests. Frontend unblocked from day one. Contract violations caught before merge. QA has a ready-made collection. This is the API-first payoff.",
    verdictType: "great",
  },
];

const VERDICT_STYLES = {
  bad: { bg: "#2a1215", border: "#6b2128", color: "#f87171", icon: "\u2716" },
  meh: { bg: "#2a2012", border: "#6b5a21", color: "#fbbf24", icon: "\u25CB" },
  good: { bg: "#122a18", border: "#216b3a", color: "#4ade80", icon: "\u2714" },
  great: { bg: "#0f1f2e", border: "#1e5a8a", color: "#38bdf8", icon: "\u2605" },
};

export default function OpenAPIFakerDemo() {
  const [activeStep, setActiveStep] = useState(0);
  const step = STEPS[activeStep];
  const vs = VERDICT_STYLES[step.verdictType];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0c0c0f",
        color: "#e0e0e6",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "28px 32px 20px",
          borderBottom: "1px solid #1e1e26",
          background: "linear-gradient(180deg, #12121a 0%, #0c0c0f 100%)",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: "#f0f0f5",
            letterSpacing: "-0.02em",
          }}
        >
          From Bare Spec to Full Mock
        </h1>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 12,
            color: "#6b6b7b",
          }}
        >
          A progressive example of OpenAPI + Faker + Prism
        </p>
      </div>

      {/* Step tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid #1e1e26",
          overflowX: "auto",
        }}
      >
        {STEPS.map((s, i) => {
          const isActive = i === activeStep;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStep(i)}
              style={{
                flex: "none",
                padding: "14px 20px",
                background: isActive ? "#18182a" : "transparent",
                border: "none",
                borderBottom: isActive
                  ? "2px solid #6366f1"
                  : "2px solid transparent",
                color: isActive ? "#c4c4ff" : "#555566",
                fontSize: 11,
                fontFamily: "inherit",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 2,
                }}
              >
                {s.label}
              </span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>{s.subtitle}</span>
            </button>
          );
        })}
      </div>

      {/* Description */}
      <div
        style={{
          padding: "20px 32px",
          fontSize: 13,
          lineHeight: 1.7,
          color: "#9999aa",
          maxWidth: 900,
          borderBottom: "1px solid #1e1e26",
        }}
      >
        {step.description}
      </div>

      {/* Content panels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: 400,
        }}
      >
        {/* Left: Spec */}
        <div
          style={{
            borderRight: "1px solid #1e1e26",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "12px 20px",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#6366f1",
              borderBottom: "1px solid #1e1e26",
              fontWeight: 700,
            }}
          >
            {activeStep < 5 ? "OpenAPI Spec (YAML)" : "Commands"}
          </div>
          <pre
            style={{
              margin: 0,
              padding: "16px 20px",
              fontSize: 11.5,
              lineHeight: 1.65,
              color: "#b8b8c8",
              overflow: "auto",
              flex: 1,
              background: "#0a0a0e",
            }}
          >
            {step.spec}
          </pre>
        </div>

        {/* Right: Mock response */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              padding: "12px 20px",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#22c55e",
              borderBottom: "1px solid #1e1e26",
              fontWeight: 700,
            }}
          >
            {activeStep < 5 ? "Mock Server Response" : "Test Output"}
          </div>
          <pre
            style={{
              margin: 0,
              padding: "16px 20px",
              fontSize: 11.5,
              lineHeight: 1.65,
              color: "#b8b8c8",
              overflow: "auto",
              flex: 1,
              background: "#08080c",
            }}
          >
            {step.mockResponse}
          </pre>
        </div>
      </div>

      {/* Verdict */}
      <div
        style={{
          margin: "0 24px 24px",
          padding: "16px 20px",
          background: vs.bg,
          border: `1px solid ${vs.border}`,
          borderRadius: 8,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 18, color: vs.color, marginTop: 1 }}>
          {vs.icon}
        </span>
        <span style={{ fontSize: 13, lineHeight: 1.6, color: vs.color }}>
          {step.verdict}
        </span>
      </div>

      {/* Navigation */}
      <div
        style={{
          padding: "0 24px 32px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
          disabled={activeStep === 0}
          style={{
            padding: "10px 20px",
            background: activeStep === 0 ? "#1a1a22" : "#1e1e30",
            border: "1px solid #2a2a3a",
            borderRadius: 6,
            color: activeStep === 0 ? "#444" : "#9999bb",
            fontSize: 12,
            fontFamily: "inherit",
            cursor: activeStep === 0 ? "default" : "pointer",
          }}
        >
          Previous
        </button>
        <div style={{ fontSize: 11, color: "#444", alignSelf: "center" }}>
          {activeStep + 1} / {STEPS.length}
        </div>
        <button
          onClick={() =>
            setActiveStep(Math.min(STEPS.length - 1, activeStep + 1))
          }
          disabled={activeStep === STEPS.length - 1}
          style={{
            padding: "10px 20px",
            background:
              activeStep === STEPS.length - 1 ? "#1a1a22" : "#2d2560",
            border: "1px solid #3d3580",
            borderRadius: 6,
            color: activeStep === STEPS.length - 1 ? "#444" : "#c4c4ff",
            fontSize: 12,
            fontFamily: "inherit",
            cursor:
              activeStep === STEPS.length - 1 ? "default" : "pointer",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

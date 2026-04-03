---
title: Backend Server Generation
description: Generate Spring Boot server interfaces from OpenAPI specs using openapi-generator-cli with interfaceOnly pattern
audience: [backend]
tools: [openapi-generator-cli, spring-boot, maven, java]
prd: "0001"
user-stories: [US-006]
last-updated: 2026-04-03
---

# Backend Server Generation

> Generate Spring Boot interfaces from your OpenAPI spec. The spec defines the shape — you implement the logic.

## Quick Start

```bash
npm run bundle                         # Bundle multi-file spec into single file
npm run stubs                          # Generate Spring Boot interfaces (requires Java 11+)
ls generated/server-spring/src/main/java/org/openapitools/api/   # See generated interfaces
ls generated/server-spring/src/main/java/org/openapitools/model/ # See generated models
cd generated/server-spring && mvn spring-boot:run                # Run the stub server (requires JDK)
```

## Overview

This guide covers generating Spring Boot server stubs from the scaffold's OpenAPI spec using `openapi-generator-cli` with the `interfaceOnly=true` pattern. The generator produces Java interfaces with method signatures matching each `operationId` — the developer creates an implementation class and fills in the business logic.

**Who this is for:** Backend developers building the API implementation.

## Prerequisites

| Tool | Version | Install | Required? |
|---|---|---|---|
| Node.js | 18+ | System install | Yes (runs openapi-generator-cli via npx) |
| Java (JRE) | 11+ | System install | Yes (code generation only) |
| Java (JDK) | 11+ | `apt install openjdk-21-jdk` | Only for compilation and running |
| Maven | 3.x | System install | Only for compilation and running |
| openapi-generator-cli | 2.x | `devDependency` (already in package.json) | Yes |

**JRE vs JDK:** Code generation only needs the JRE (`java`). Compiling and running the generated project needs the full JDK (`javac`). Check with `javac -version` — if it fails, install the JDK.

## How It Works

### Generating interfaces

```bash
npm run stubs
# Runs: openapi-generator-cli generate -i specs/order-api.bundled.yaml -g spring
#   -o generated/server-spring
#   --additional-properties=interfaceOnly=true,useSpringBoot3=true
#   --skip-validate-spec
```

This produces a full Maven project in `generated/server-spring/` with:

```
generated/server-spring/
├── pom.xml                                    # Spring Boot 3 project
├── src/main/java/org/openapitools/
│   ├── api/
│   │   └── OrdersApi.java                     # THE INTERFACE — your contract
│   ├── model/
│   │   ├── CreateOrderRequest.java            # Request/response model
│   │   ├── Customer.java                      # Maps to schemas/Customer
│   │   ├── ErrorResponse.java                 # Maps to schemas/ErrorResponse
│   │   └── ...
│   └── OpenApiGeneratorApplication.java       # Spring Boot main class
└── src/main/resources/application.properties
```

### The generated interface

```java
@Validated
@Tag(name = "Orders")
public interface OrdersApi {

    default ResponseEntity<CreateOrderRequest> createOrder(@Valid @RequestBody CreateOrderRequest body) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);  // 501 — you implement this
    }

    default ResponseEntity<Void> deleteOrder(@PathVariable("orderId") UUID orderId) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

    default ResponseEntity<CreateOrderRequest> getOrder(@PathVariable("orderId") UUID orderId) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

    default ResponseEntity<List<OrderItem>> listOrderItems(@PathVariable("orderId") UUID orderId) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

    default ResponseEntity<ListOrders200Response> listOrders(
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer limit,
        @RequestParam(required = false) String status) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

    default ResponseEntity<CreateOrderRequest> updateOrder(
        @PathVariable("orderId") UUID orderId,
        @Valid @RequestBody CreateOrderRequest body) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }
}
```

Every method returns `501 Not Implemented` by default — it compiles and runs immediately.

### Implementing the interface

```java
@RestController
public class OrdersApiImpl implements OrdersApi {

    @Override
    public ResponseEntity<CreateOrderRequest> getOrder(UUID orderId) {
        // Your business logic here
        CreateOrderRequest order = new CreateOrderRequest();
        order.setId(orderId);
        order.setStatus(CreateOrderRequest.StatusEnum.CONFIRMED);
        return ResponseEntity.ok(order);
    }
    // Other methods remain 501 until you implement them
}
```

### Using the bundled spec (opposite of frontend)

```bash
# CORRECT for backend — use bundled spec
openapi-generator-cli generate -i specs/order-api.bundled.yaml -g spring ...

# CORRECT for frontend — use source spec
openapi-typescript specs/order-api.yaml ...
```

**Why the difference:** The Scalar bundler's `x-ext` artifacts break TypeScript type generation but don't affect Java code generation. `openapi-generator-cli` works best with a single resolved file.

## Configuration

### npm script

```json
{ "stubs": "openapi-generator-cli generate -i specs/order-api.bundled.yaml -g spring -o generated/server-spring --additional-properties=interfaceOnly=true,useSpringBoot3=true --skip-validate-spec" }
```

### Key flags

| Flag | What it does |
|---|---|
| `-g spring` | Spring Boot generator (Jakarta EE) |
| `interfaceOnly=true` | Generates interfaces only — you implement them |
| `useSpringBoot3=true` | Targets Spring Boot 3 / Jakarta EE (not javax) |
| `--skip-validate-spec` | Bypasses openapi-generator's validator (Scalar bundler creates duplicate params) |

### Additional properties

| Property | Default | Description |
|---|---|---|
| `delegatePattern` | `false` | Delegate interfaces instead of direct implementation |
| `reactive` | `false` | WebFlux instead of servlet |
| `basePackage` | `org.openapitools` | Base Java package |
| `apiPackage` | `org.openapitools.api` | API interface package |
| `modelPackage` | `org.openapitools.model` | Model class package |
| `skipDefaultInterface` | `false` | Force implementation of all methods (no 501 defaults) |
| `documentationProvider` | `springdoc` | API docs: `springdoc`, `springfox`, `none` |
| `serializationLibrary` | `jackson` | JSON: `jackson` or `gson` |

### Java version in generated pom.xml

Default is Java 17. If your JDK is different:

```xml
<properties>
    <java.version>21</java.version>  <!-- Match your installed JDK -->
</properties>
```

## Common Pitfalls

**1. "Fatal error compiling: release version 17 not supported"**
- Problem: Generated pom.xml targets Java 17 but your JDK is a different version.
- Fix: Update `<java.version>` in `generated/server-spring/pom.xml` to match your JDK.

**2. openapi-generator validator rejects the spec**
- Problem: Scalar bundler creates duplicate parameters that trip the validator.
- Fix: Always use `--skip-validate-spec`. The spec is validated by Scalar CLI and Spectral.

**3. "javac: command not found"**
- Problem: Only JRE installed, not JDK. Generation works but compilation fails.
- Fix: Install the full JDK: `apt install openjdk-21-jdk`.

**4. Editing generated files gets overwritten**
- Problem: Next `npm run stubs` overwrites your changes.
- Fix: Put your implementation in a separate source directory, or use `.openapi-generator-ignore`.

**5. Model names don't match schema names**
- Problem: `Order` schema becomes `CreateOrderRequest` (named after the first context it appears in).
- Fix: Expected behavior. Check `generated/.../model/` for actual class names.

## Multi-Environment Usage

The generated Spring Boot project reads configuration from `application.properties`:

```properties
server.port=8080
```

Override per environment:

```bash
mvn spring-boot:run                              # Dev (default 8080)
mvn spring-boot:run -Dspring.profiles.active=qa  # QA profile
SERVER_PORT=9090 mvn spring-boot:run             # Custom port
```

## Alternatives

| Generator | Command | When to use |
|---|---|---|
| **Quarkus (JAX-RS)** | `-g jaxrs-spec` | Quarkus-based teams |
| **Node.js Express** | `-g nodejs-express-server` | Node.js teams |
| **Python Flask** | `-g python-flask` | Python teams (Connexion) |
| **ASP.NET** | Use NSwag or Kiota | .NET teams |

All use the same bundled spec and `--skip-validate-spec`.

## References

- openapi-generator Spring docs: https://openapi-generator.tech/docs/generators/spring/
- openapi-generator CLI usage: https://openapi-generator.tech/docs/usage/
- openapi-generator config options: https://openapi-generator.tech/docs/generators/spring/#config-options
- Spring Boot 3 migration: https://spring.io/blog/2022/05/24/preparing-for-spring-boot-3-0
- openapi-generator GitHub: https://github.com/OpenAPITools/openapi-generator

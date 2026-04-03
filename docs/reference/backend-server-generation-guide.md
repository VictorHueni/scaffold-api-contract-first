# Backend Server Generation Guide

Practical guide for generating and using typed server stubs from OpenAPI specs. Based on lessons learned during scaffold implementation.

**Used by:** [`0001_prd_api-first-scaffold.md`](../product-specs/0001_prd_api-first-scaffold.md) (US-006)

---

## Stack

| Tool | Purpose | Install |
|---|---|---|
| **openapi-generator-cli** | Generate server interfaces and models from OpenAPI spec | npm devDependency (`@openapitools/openapi-generator-cli`) |
| **Spring Boot 3** | Target framework for generated stubs | Generated pom.xml |
| **Java 11+ (JDK)** | Required to compile and run the stubs | System install |
| **Maven** | Build tool for the generated project | System install |

---

## Generating Spring Boot Stubs

### The command

```bash
npx openapi-generator-cli generate \
  -i specs/order-api.bundled.yaml \
  -g spring \
  -o generated/server-spring \
  --additional-properties=interfaceOnly=true,useSpringBoot3=true \
  --skip-validate-spec
```

### Key flags explained

| Flag | Why |
|---|---|
| `-g spring` | Spring Boot generator (Jakarta EE, Spring Boot 3 compatible) |
| `interfaceOnly=true` | Generates **Java interfaces** only — no controller implementations. The developer implements the interface. This is the contract-first pattern: the spec defines the shape, the developer fills in the logic. |
| `useSpringBoot3=true` | Targets Spring Boot 3 / Jakarta EE (not Spring Boot 2 / javax). Uses `jakarta.` package imports. |
| `--skip-validate-spec` | Skips openapi-generator's built-in spec validation. Required because the Scalar CLI bundler creates duplicate parameter entries that trip the validator but don't affect code generation. The spec is already validated by Scalar CLI and Spectral. |

### The npm script

```json
{
  "stubs": "openapi-generator-cli generate -i specs/order-api.bundled.yaml -g spring -o generated/server-spring --additional-properties=interfaceOnly=true,useSpringBoot3=true --skip-validate-spec"
}
```

### Use the bundled spec, not the source

```bash
# CORRECT — use bundled spec (all $refs resolved into one file)
npx openapi-generator-cli generate -i specs/order-api.bundled.yaml -g spring ...

# WRONG — multi-file spec with $ref may not resolve correctly for all generators
npx openapi-generator-cli generate -i specs/order-api.yaml -g spring ...
```

**Why:** Unlike `openapi-typescript` (which resolves `$ref` internally), `openapi-generator-cli` works best with a single bundled file where all references are resolved. The Scalar CLI bundler's `x-ext` artifacts don't affect Java code generation — they only cause issues with TypeScript type generation.

**This is the opposite of the frontend guide** — frontend uses source spec, backend uses bundled spec. The reason is different: TypeScript generation breaks on `x-ext` artifacts, Java generation ignores them.

---

## What Gets Generated

### Directory structure

```
generated/server-spring/
├── pom.xml                                    # Maven project with Spring Boot 3 parent
├── src/main/java/org/openapitools/
│   ├── api/
│   │   ├── OrdersApi.java                     # The interface — YOUR contract
│   │   └── ApiUtil.java                       # Helper utility
│   ├── model/
│   │   ├── CreateOrderRequest.java            # Request/response model
│   │   ├── Customer.java                      # Maps to components/schemas/Customer
│   │   ├── ErrorResponse.java                 # Maps to components/schemas/ErrorResponse
│   │   ├── ListOrders200Response.java         # Paginated list response
│   │   └── ...                                # Other generated models
│   └── OpenApiGeneratorApplication.java       # Spring Boot main class
└── src/main/resources/
    └── application.properties
```

### The generated interface (OrdersApi.java)

```java
@Validated
@Tag(name = "Orders")
public interface OrdersApi {

    // Each method matches an operationId from the spec
    default ResponseEntity<CreateOrderRequest> createOrder(
        @Valid @RequestBody CreateOrderRequest body
    ) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);  // 501 — you implement this
    }

    default ResponseEntity<Void> deleteOrder(
        @PathVariable("orderId") UUID orderId
    ) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

    default ResponseEntity<CreateOrderRequest> getOrder(
        @PathVariable("orderId") UUID orderId
    ) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

    default ResponseEntity<List<OrderItem>> listOrderItems(
        @PathVariable("orderId") UUID orderId
    ) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

    default ResponseEntity<ListOrders200Response> listOrders(
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer limit,
        @RequestParam(required = false) String status
    ) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }

    default ResponseEntity<CreateOrderRequest> updateOrder(
        @PathVariable("orderId") UUID orderId,
        @Valid @RequestBody CreateOrderRequest body
    ) {
        return new ResponseEntity<>(HttpStatus.NOT_IMPLEMENTED);
    }
}
```

**Key points:**
- Each method returns `501 Not Implemented` by default — it compiles and runs immediately, every endpoint returns 501 until you implement it
- `@Validated` enables request validation from the spec constraints
- Path parameters with `format: uuid` become `UUID` types
- Request bodies are validated with `@Valid`
- Pagination parameters are `@RequestParam(required = false)`

### Implementing the interface

Create a class that implements the interface and override the methods you want to implement:

```java
@RestController
public class OrdersApiImpl implements OrdersApi {

    @Override
    public ResponseEntity<CreateOrderRequest> getOrder(UUID orderId) {
        // Your business logic here
        CreateOrderRequest order = new CreateOrderRequest();
        order.setId(orderId);
        order.setStatus(CreateOrderRequest.StatusEnum.CONFIRMED);
        // ... set other fields
        return ResponseEntity.ok(order);
    }

    // Other methods remain 501 until you implement them
}
```

**The developer's job:** implement the interface. The shape, the validation, the routing — already generated from the spec.

---

## Prerequisites

### JRE vs JDK — a common gotcha

| Component | What it provides | Needed for |
|---|---|---|
| **JRE** (Java Runtime Environment) | `java` command | Running Maven, running openapi-generator-cli |
| **JDK** (Java Development Kit) | `java` + `javac` + dev tools | Compiling generated code, running `mvn spring-boot:run` |

**openapi-generator-cli only needs JRE** — it generates code via templates, no compilation. But to **compile and run** the generated Spring Boot project, you need the full **JDK**.

Check which you have:

```bash
java -version     # Works with JRE or JDK
javac -version    # Only works with JDK — if this fails, you need JDK
```

Install JDK (Debian/Ubuntu):

```bash
sudo apt install openjdk-21-jdk
```

### Java version compatibility

The generated `pom.xml` targets a specific Java version:

```xml
<properties>
    <java.version>17</java.version>  <!-- Default with useSpringBoot3=true -->
</properties>
```

If your JDK is a different version, update `pom.xml`:

```xml
<java.version>21</java.version>  <!-- Match your installed JDK -->
```

Or pass it as a property:

```bash
mvn spring-boot:run -Djava.version=21
```

### Maven

Maven must be installed separately. It is not an npm dependency.

```bash
# macOS
brew install maven

# Debian/Ubuntu
sudo apt install maven

# Verify
mvn --version
```

---

## Common Pitfalls

### 1. Don't validate the bundled spec with openapi-generator

**Problem:** `openapi-generator-cli` has its own spec validator that flags issues the Scalar bundler introduces (duplicate parameters from resolved `$ref` pointers).

**Fix:** Always use `--skip-validate-spec`. Your spec is already validated by Scalar CLI and Spectral — you don't need a third validator.

### 2. Don't confuse JRE and JDK

**Problem:** `java -version` works but `mvn compile` fails with "javac not found" or "Fatal error compiling".

**Fix:** Install the full JDK, not just the JRE. See Prerequisites section above.

### 3. Don't commit generated code

**Problem:** `generated/server-spring/` is a full Maven project with hundreds of files. Committing it creates merge conflicts and stale code.

**Fix:** The `generated/` directory is in `.gitignore`. Run `npm run stubs` to regenerate after spec changes. The generated code is always reproducible from the spec.

### 4. Don't modify generated files directly

**Problem:** If you edit `OrdersApi.java` or generated model classes, your changes are lost on the next `npm run stubs`.

**Fix:** Create your implementation class (`OrdersApiImpl.java`) in a separate source directory outside `generated/`. Or use openapi-generator's `.openapi-generator-ignore` file to prevent overwriting specific files.

### 5. Model naming may not match schema names

**Problem:** openapi-generator renames some models based on the context where they appear. For example, the `Order` schema might become `CreateOrderRequest` if it's first encountered in the POST request body.

**Fix:** This is expected behavior. The generated model contains the same fields — only the class name differs. Check `generated/server-spring/src/main/java/org/openapitools/model/` for the actual names.

### 6. Pagination response requires a wrapper model

**Problem:** The `GET /orders` endpoint returns a paginated response with `data` (array) and `pagination` (object). openapi-generator creates a separate `ListOrders200Response` model for this.

**Fix:** Use the generated wrapper model as-is. It matches the spec's response shape exactly.

---

## Additional Properties Reference

The `spring` generator supports many additional properties beyond `interfaceOnly` and `useSpringBoot3`:

| Property | Default | Description |
|---|---|---|
| `interfaceOnly` | `false` | Generate only interfaces, not controller implementations |
| `useSpringBoot3` | `false` | Target Spring Boot 3 (Jakarta EE) instead of Spring Boot 2 (javax) |
| `delegatePattern` | `false` | Generate delegate interfaces for cleaner separation (alternative to interfaceOnly) |
| `useTags` | `false` | Use tags to name generated API classes (e.g., `OrdersApi` from tag "Orders") |
| `basePackage` | `org.openapitools` | Base Java package |
| `apiPackage` | `org.openapitools.api` | Package for API interfaces |
| `modelPackage` | `org.openapitools.model` | Package for model classes |
| `reactive` | `false` | Generate reactive (WebFlux) interfaces instead of servlet |
| `skipDefaultInterface` | `false` | Skip generating default method bodies (forces implementation of all methods) |
| `documentationProvider` | `springdoc` | API docs provider: `springdoc`, `springfox`, `none` |
| `serializationLibrary` | `jackson` | JSON library: `jackson`, `gson` |

Example with custom packages:

```bash
npx openapi-generator-cli generate \
  -i specs/order-api.bundled.yaml \
  -g spring \
  -o generated/server-spring \
  --additional-properties=interfaceOnly=true,useSpringBoot3=true,basePackage=com.example.orders,apiPackage=com.example.orders.api,modelPackage=com.example.orders.model \
  --skip-validate-spec
```

---

## Alternative Generators

| Generator | Command | When to use |
|---|---|---|
| **Quarkus (JAX-RS)** | `-g jaxrs-spec` | Quarkus-based teams. Generates JAX-RS interfaces. Same `--skip-validate-spec` needed. |
| **Node.js Express** | `-g nodejs-express-server` | Node.js teams. Full scaffold with validation middleware. |
| **Python Flask (Connexion)** | `-g python-flask` | Python teams. Routes and validates directly from the spec. |
| **ASP.NET (NSwag/Kiota)** | Use NSwag or Kiota separately | .NET teams. Strong typing and middleware generation. |

All generators use the same bundled spec and the same `--skip-validate-spec` flag.

---

## References

- openapi-generator Spring docs: https://openapi-generator.tech/docs/generators/spring/
- openapi-generator CLI usage: https://openapi-generator.tech/docs/usage/
- openapi-generator additional properties: https://openapi-generator.tech/docs/generators/spring/#config-options
- Spring Boot 3 migration guide: https://spring.io/blog/2022/05/24/preparing-for-spring-boot-3-0
- openapi-generator GitHub: https://github.com/OpenAPITools/openapi-generator

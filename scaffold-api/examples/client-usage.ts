import createClient from "openapi-fetch";
import type { paths } from "../generated/api-types";

// Create a typed API client
const client = createClient<paths>({
  baseUrl: "http://localhost:4010",
  headers: {
    "X-API-Key": "your-api-key-here",
  },
});

// Example: List orders with pagination
async function listOrders() {
  const { data, error } = await client.GET("/orders", {
    params: {
      query: {
        page: 1,
        limit: 20,
        status: "pending",
      },
    },
  });

  if (error) {
    console.error("Failed to list orders:", error);
    return;
  }

  console.log("Orders:", data);
}

// Example: Get a single order by ID
async function getOrder(orderId: string) {
  const { data, error } = await client.GET("/orders/{orderId}", {
    params: {
      path: { orderId },
    },
  });

  if (error) {
    console.error("Order not found:", error);
    return;
  }

  console.log("Order:", data);
  // TypeScript knows: data.id is string, data.status is enum, data.customer is Customer, etc.
}

// Example: Create an order
async function createOrder() {
  const { data, error } = await client.POST("/orders", {
    body: {
      customer: {
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "+41791234567",
        shippingAddress: {
          street: "123 Main St",
          city: "Zurich",
          state: "ZH",
          postalCode: "8001",
          country: "CH",
        },
      },
      items: [
        {
          productId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          productName: "Wireless Headphones",
          quantity: 1,
          unitPrice: 89.99,
        },
      ],
      currency: "CHF",
      notes: "Please deliver before noon",
    },
  });

  if (error) {
    console.error("Failed to create order:", error);
    return;
  }

  console.log("Created order:", data?.id);
}

listOrders();
getOrder("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
createOrder();

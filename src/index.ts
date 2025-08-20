import { Container } from "@cloudflare/containers";
import { Hono } from "hono";

export class MyContainer extends Container<Env> {
  // Port the container listens on (default: 8080)
  defaultPort = 8080;
  // Time before container sleeps due to inactivity (default: 30s)
  sleepAfter = "2m";
  // Environment variables passed to the container
  envVars = {
    MESSAGE: "I was passed in via the container class!",
  };
  async runPython(code: string) {
    try {
      const response = await this.containerFetch("https://container/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({code})
      });
      
      if (!response.ok) {
        throw new Error(`Container responded with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in runPython:", error);
      throw error;
    }
  }
}

// Create Hono app with proper typing for Cloudflare Workers
const app = new Hono<{
  Bindings: Env;
}>();

// Home route with available endpoints
app.get("/", (c) => {
  return c.text(
    "Available endpoints:\n" +
      "POST /sandbox/<ID> - Start a container for each ID with a 2m timeout\n" +
      "GET /health?id=<ID> - Health check",
  );
});

// Route requests to a specific container using the container ID
app.post("/sandbox/:id", async (c) => {
  try {
    const payload = await c.req.json();
    const id = c.req.param("id");
    const containerId = c.env.MY_CONTAINER.idFromName(`/container/${id}`);
    const container = c.env.MY_CONTAINER.get(containerId);
    const result = await container.runPython(payload.code);
    return c.json(result);
  } catch (error) {
    console.error("Error in sandbox endpoint:", error);
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

app.get("/health", async (c) => {
  const id = c.req.query("id");
  const containerId = c.env.MY_CONTAINER.idFromName(`/container/${id}`);
  const container = c.env.MY_CONTAINER.get(containerId);
  return await container.fetch(c.req.raw);
});

export default app;

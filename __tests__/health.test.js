import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { initDb } from "../src/db/index.js";
import { characterRoutes } from "../src/modules/characters/routes.js";

test("GET /health ok", async () => {
  const app = Fastify();
  await app.register(websocket);
  const db = await initDb();
  app.decorate("db", db);

  app.get("/health", async () => ({ ok: true }));
  app.register(characterRoutes);

  const res = await app.inject({ method: "GET", url: "/health" });
  expect(res.statusCode).toBe(200);
  expect(JSON.parse(res.body).ok).toBe(true);
});

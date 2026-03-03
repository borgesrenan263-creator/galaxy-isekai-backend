import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { initDb } from "../src/db/index.js";
import { enemyRoutes } from "../src/modules/enemies/routes.js";

test("GET /enemies returns seeded NPCs", async () => {
  const app = Fastify();
  await app.register(websocket);
  const db = await initDb();
  app.decorate("db", db);

  app.register(enemyRoutes);

  const res = await app.inject({ method: "GET", url: "/enemies" });
  const body = JSON.parse(res.body);
  expect(body.ok).toBe(true);
  expect(body.total).toBeGreaterThan(0);
});

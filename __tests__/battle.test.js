import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { initDb } from "../src/db/index.js";
import { battleRoutes } from "../src/modules/battle/routes.js";

test("POST /battle/simulate requires attacker", async () => {
  const app = Fastify();
  await app.register(websocket);
  const db = await initDb();
  app.decorate("db", db);

  app.register(battleRoutes);

  const res = await app.inject({
    method: "POST",
    url: "/battle/simulate",
    payload: {}
  });

  expect(res.statusCode).toBe(200);
  const body = JSON.parse(res.body);
  expect(body.ok).toBe(false);
});

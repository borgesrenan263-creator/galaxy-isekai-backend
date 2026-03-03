import Fastify from "fastify";
import { initDb } from "./db/index.js";

import { characterRoutes } from "./modules/characters/routes.js";
import { battleRoutes } from "./modules/battle/routes.js";
import { enemiesRoutes } from "./modules/enemies/routes.js";
import { metricsRoutes, incHttp } from "./modules/metrics/index.js";
import { leaderboardRoutes } from "./modules/leaderboard/routes.js";

import type { FastifyInstance } from "fastify";

const PORT = Number(process.env.PORT || 3333);
const HOST = process.env.HOST || "0.0.0.0";

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  // metrics hook
  app.addHook("onRequest", async () => {
    incHttp();
  });

  // db
  const db = await initDb();
  app.decorate("db", db);

  // health
  app.get("/health", async () => ({
    ok: true,
    name: "Galaxy Isekai Protocol API",
  }));

  // routes
  await app.register(characterRoutes);
  await app.register(battleRoutes);
  await app.register(enemiesRoutes);
  await app.register(metricsRoutes);
  await app.register(leaderboardRoutes);

  return app;
}

async function start() {
  try {
    const app = await buildApp();
    await app.listen({ port: PORT, host: HOST });
    app.log.info("🚀 Server up");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();

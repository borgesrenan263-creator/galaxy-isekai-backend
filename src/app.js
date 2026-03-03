import Fastify from "fastify";

import { initDb } from "./db/index.js";

import { characterRoutes } from "./modules/characters/routes.js";
import { battleRoutes } from "./modules/battle/routes.js";
import { enemiesRoutes } from "./modules/enemies/routes.js";
import { metricsRoutes, incHttp } from "./modules/metrics/index.js";
import { leaderboardRoutes } from "./modules/leaderboard/routes.js";

// equipment routes (se existir no seu projeto) a gente não importa aqui
// pra não bater rota duplicada. O catálogo agora está em items/equipment.js

const PORT = Number(process.env.PORT || 3333);
const HOST = process.env.HOST || "0.0.0.0";

const app = Fastify({ logger: true });

// hook simples pra contar requests (metrics)
app.addHook("onRequest", async () => {
  incHttp();
});

// db
const db = await initDb();
app.decorate("db", db);

// health
app.get("/health", async () => ({ ok: true, name: "Galaxy Isekai Protocol API" }));

// routes (com prefixos)
await app.register(characterRoutes);           // /characters...
await app.register(battleRoutes);              // /battle...
await app.register(enemiesRoutes);             // /enemies...
await app.register(metricsRoutes);             // /metrics
await app.register(leaderboardRoutes);         // /leaderboard...

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info("🚀 Server up");
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

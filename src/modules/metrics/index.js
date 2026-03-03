let wsConnections = 0;

const counters = {
  http_requests_total: 0,
  battles_total: 0,
  battle_errors_total: 0,
};

const hist = {
  battle_duration_ms: [],
};

export function incHttp() { counters.http_requests_total++; }
export function incBattle() { counters.battles_total++; }
export function incBattleError() { counters.battle_errors_total++; }

export function incWs() { wsConnections++; }
export function decWs() { wsConnections = Math.max(0, wsConnections - 1); }

export function observeBattleDurationMs(ms) {
  const v = Number(ms || 0);
  if (!Number.isFinite(v) || v < 0) return;
  hist.battle_duration_ms.push(v);
  if (hist.battle_duration_ms.length > 500) hist.battle_duration_ms.shift();
}

function quantile(arr, q) {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const pos = Math.floor((a.length - 1) * q);
  return a[pos];
}

export function renderPrometheus() {
  const p50 = quantile(hist.battle_duration_ms, 0.50);
  const p90 = quantile(hist.battle_duration_ms, 0.90);
  const p99 = quantile(hist.battle_duration_ms, 0.99);

  return [
    "# HELP galaxy_http_requests_total Total HTTP requests",
    "# TYPE galaxy_http_requests_total counter",
    `galaxy_http_requests_total ${counters.http_requests_total}`,

    "# HELP galaxy_ws_connections Current websocket connections",
    "# TYPE galaxy_ws_connections gauge",
    `galaxy_ws_connections ${wsConnections}`,

    "# HELP galaxy_battles_total Total battles simulated",
    "# TYPE galaxy_battles_total counter",
    `galaxy_battles_total ${counters.battles_total}`,

    "# HELP galaxy_battle_errors_total Total battle errors",
    "# TYPE galaxy_battle_errors_total counter",
    `galaxy_battle_errors_total ${counters.battle_errors_total}`,

    "# HELP galaxy_battle_duration_ms_quantiles Battle duration quantiles (ms)",
    "# TYPE galaxy_battle_duration_ms_quantiles gauge",
    `galaxy_battle_duration_ms_quantiles{q="0.50"} ${p50}`,
    `galaxy_battle_duration_ms_quantiles{q="0.90"} ${p90}`,
    `galaxy_battle_duration_ms_quantiles{q="0.99"} ${p99}`,
    ""
  ].join("\n");
}

export async function metricsRoutes(app) {
  app.get("/metrics", async (_req, reply) => {
    reply.header("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    return renderPrometheus();
  });
}

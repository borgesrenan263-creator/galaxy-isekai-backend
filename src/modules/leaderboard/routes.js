/**
 * Seasonal Leaderboard (Supreme)
 * - Tables auto-created
 * - /leaderboard/top (current season)
 * - /leaderboard/season/current
 * - /leaderboard/season/:id/top
 * - /leaderboard/me (rank do personagem na season)
 * - app.seasonScoreUpsert(characterId, {win, loss})
 */

function pad2(n) { return String(n).padStart(2, "0"); }

export function seasonIdFromNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  return `${y}-${m}`; // ex: 2026-03
}

function clampInt(v, def, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  const i = Math.trunc(n);
  return Math.max(min, Math.min(max, i));
}

function ensureTables(db) {
  // seasons
  db.run(`
    CREATE TABLE IF NOT EXISTS seasons (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL
    )
  `);

  // season_scores (wins/losses por personagem/season)
  db.run(`
    CREATE TABLE IF NOT EXISTS season_scores (
      season_id TEXT NOT NULL,
      character_id TEXT NOT NULL,
      wins INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (season_id, character_id)
    )
  `);

  // índices para TOP rápido
  db.run(`CREATE INDEX IF NOT EXISTS idx_season_scores_season ON season_scores(season_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_season_scores_wins ON season_scores(season_id, wins DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_season_scores_updated ON season_scores(season_id, updated_at DESC)`);
}

export async function leaderboardRoutes(app) {
  // db disponível?
  if (!app.db) throw new Error("leaderboardRoutes: app.db missing");

  ensureTables(app.db);

  // helper: garante que a season existe
  function ensureSeason(seasonId) {
    app.db.run(
      "INSERT OR IGNORE INTO seasons (id, created_at) VALUES (?, ?)",
      [seasonId, Date.now()]
    );
    return seasonId;
  }

  // helper SUPREMO: upsert de score (chamado por battle)
  app.decorate("seasonScoreUpsert", (characterId, { win = false, loss = false } = {}) => {
    const season_id = ensureSeason(seasonIdFromNow());

    const row = app.db.get(
      "SELECT wins, losses FROM season_scores WHERE season_id=? AND character_id=?",
      [season_id, characterId]
    );

    const wins = (row?.wins ?? 0) + (win ? 1 : 0);
    const losses = (row?.losses ?? 0) + (loss ? 1 : 0);

    app.db.run(
      `
      INSERT INTO season_scores (season_id, character_id, wins, losses, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(season_id, character_id)
      DO UPDATE SET wins=excluded.wins, losses=excluded.losses, updated_at=excluded.updated_at
      `,
      [season_id, characterId, wins, losses, Date.now()]
    );

    return season_id;
  });

  // prefix
  // /leaderboard/...
  // ------------------------

  // season atual
  app.get("/leaderboard/season/current", async () => {
    const id = ensureSeason(seasonIdFromNow());
    return { ok: true, season: { id } };
  });

  // TOP da season atual (alias principal)
  app.get("/leaderboard/top", async (req) => {
    const limit = clampInt(req.query?.limit, 50, 1, 200);
    const season_id = ensureSeason(seasonIdFromNow());

    const rows = app.db.all(
      `
      SELECT
        ss.character_id,
        c.name,
        c.class,
        c.level,
        ss.wins,
        ss.losses,
        (ss.wins - ss.losses) AS score,
        ss.updated_at
      FROM season_scores ss
      LEFT JOIN characters c ON c.id = ss.character_id
      WHERE ss.season_id = ?
      ORDER BY score DESC, ss.wins DESC, ss.updated_at DESC
      LIMIT ?
      `,
      [season_id, limit]
    );

    return { ok: true, season: { id: season_id }, total: rows.length, leaderboard: rows };
  });

  // TOP por season específica
  app.get("/leaderboard/season/:id/top", async (req, reply) => {
    const id = String(req.params.id || "").trim();
    if (!id) return reply.code(400).send({ ok: false, error: "bad_season" });

    const limit = clampInt(req.query?.limit, 50, 1, 200);
    const season_id = ensureSeason(id);

    const rows = app.db.all(
      `
      SELECT
        ss.character_id,
        c.name,
        c.class,
        c.level,
        ss.wins,
        ss.losses,
        (ss.wins - ss.losses) AS score,
        ss.updated_at
      FROM season_scores ss
      LEFT JOIN characters c ON c.id = ss.character_id
      WHERE ss.season_id = ?
      ORDER BY score DESC, ss.wins DESC, ss.updated_at DESC
      LIMIT ?
      `,
      [season_id, limit]
    );

    return { ok: true, season: { id: season_id }, total: rows.length, leaderboard: rows };
  });

  // rank do player na season atual
  // GET /leaderboard/me?character_id=...
  app.get("/leaderboard/me", async (req, reply) => {
    const character_id = String(req.query?.character_id || "").trim();
    if (!character_id) return reply.code(400).send({ ok: false, error: "missing_character_id" });

    const season_id = ensureSeason(seasonIdFromNow());

    // pega score do player
    const me = app.db.get(
      `
      SELECT wins, losses, (wins - losses) AS score
      FROM season_scores
      WHERE season_id=? AND character_id=?
      `,
      [season_id, character_id]
    );

    if (!me) return reply.code(404).send({ ok: false, error: "not_ranked" });

    // rank = 1 + quantos têm score maior (desempate wins/updated)
    const rankRow = app.db.get(
      `
      SELECT 1 + COUNT(*) AS rank
      FROM (
        SELECT
          character_id,
          (wins - losses) AS score,
          wins,
          updated_at
        FROM season_scores
        WHERE season_id=?
      ) t
      WHERE
        (t.score > ?)
        OR (t.score = ? AND t.wins > ?)
      `,
      [season_id, me.score, me.score, me.wins]
    );

    return {
      ok: true,
      season: { id: season_id },
      character_id,
      rank: rankRow?.rank ?? null,
      wins: me.wins,
      losses: me.losses,
      score: me.score,
    };
  });
}

export async function leaderboardRoutes(app) {
  const db = app.db;

  // =============================
  // helper: season atual
  // =============================
  function seasonIdFromNow() {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  // =============================
  // GET /leaderboard/season/current
  // =============================
  app.get("/leaderboard/season/current", async () => {
    const id = seasonIdFromNow();
    return { ok: true, season: { id } };
  });

  // =============================
  // GET /leaderboard/top
  // =============================
  app.get("/leaderboard/top", async (req) => {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));
    const season_id = seasonIdFromNow();

    const rows = db.all(
      `
      SELECT
        ss.character_id,
        ss.wins,
        ss.losses,
        (ss.wins - ss.losses) AS score
      FROM season_scores ss
      WHERE ss.season_id = ?
      ORDER BY score DESC, ss.wins DESC
      LIMIT ?
      `,
      [season_id, limit]
    );

    return {
      ok: true,
      season: { id: season_id },
      total: rows.length,
      leaderboard: rows,
    };
  });

  // =============================
  // helper: atualizar score
  // =============================
  app.decorate(
    "seasonScoreUpsert",
    (characterId, { win = false, loss = false } = {}) => {
      const season_id = seasonIdFromNow();

      db.run(
        `INSERT OR IGNORE INTO seasons (id, created_at) VALUES (?, ?)`,
        [season_id, Date.now()]
      );

      const row = db.get(
        `SELECT wins, losses FROM season_scores
         WHERE season_id=? AND character_id=?`,
        [season_id, characterId]
      );

      const wins = (row?.wins || 0) + (win ? 1 : 0);
      const losses = (row?.losses || 0) + (loss ? 1 : 0);

      db.run(
        `INSERT INTO season_scores
          (season_id, character_id, wins, losses, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(season_id, character_id)
         DO UPDATE SET
           wins=excluded.wins,
           losses=excluded.losses,
           updated_at=excluded.updated_at`,
        [season_id, characterId, wins, losses, Date.now()]
      );

      return season_id;
    }
  );
}

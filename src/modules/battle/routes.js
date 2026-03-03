import { simulateBattle } from "./engine.js";
import { rollDrops } from "../items/loot.js";
import { withEquipmentStats } from "../items/equipment.js";

const COOLDOWN_MS = 15000;

export async function battleRoutes(app) {
  // =============================
  // POST /battle/simulate
  // =============================
  app.post("/battle/simulate", async (req, reply) => {
    try {
      const { attacker_id, defender_id, seed = null } = req.body || {};

      if (!attacker_id || !defender_id) {
        return reply.code(400).send({ ok: false, error: "missing_ids" });
      }

      const attacker = app.db.get(
        "SELECT * FROM characters WHERE id=?",
        [attacker_id]
      );

      const defender = app.db.get(
        "SELECT * FROM characters WHERE id=?",
        [defender_id]
      );

      if (!attacker || !defender) {
        return reply.code(404).send({ ok: false, error: "character_not_found" });
      }

      // =============================
      // cooldown check
      // =============================
      const now = Date.now();
      const last = Number(attacker.last_battle_at || 0);

      if (now - last < COOLDOWN_MS) {
        return reply.code(429).send({
          ok: false,
          error: "cooldown_active",
          remaining_ms: COOLDOWN_MS - (now - last),
        });
      }

      // =============================
      // apply equipment bonuses
      // =============================
      const atkFinal = withEquipmentStats(attacker);
      const defFinal = withEquipmentStats(defender);

      // =============================
      // simulate
      // =============================
      const sim = simulateBattle({
        attacker: atkFinal,
        defender: defFinal,
        seed,
      });

      const winnerId = sim.winnerId;
      const loserId = sim.loserId;

      // =============================
      // XP + stats update
      // =============================
      app.db.run(
        `UPDATE characters
         SET last_battle_at=?, wins=wins+?, losses=losses+?
         WHERE id=?`,
        [now, winnerId === attacker_id ? 1 : 0, winnerId === attacker_id ? 0 : 1, attacker_id]
      );

      app.db.run(
        `UPDATE characters
         SET last_battle_at=?, wins=wins+?, losses=losses+?
         WHERE id=?`,
        [now, winnerId === defender_id ? 1 : 0, winnerId === defender_id ? 0 : 1, defender_id]
      );

      // =============================
      // 🎯 SEASONAL LEADERBOARD HOOK
      // =============================
      if (app.seasonScoreUpsert) {
        if (winnerId) {
          await app.seasonScoreUpsert(winnerId, { win: true });
        }
        if (loserId) {
          await app.seasonScoreUpsert(loserId, { loss: true });
        }
      }

      // =============================
      // drops
      // =============================
      const drops = rollDrops(sim.rng);

      // =============================
      // save battle
      // =============================
      const battleId = crypto.randomUUID();

      app.db.run(
        `INSERT INTO battles
        (id, attacker_id, defender_id, winner_id, loser_id, rounds_count, seed, replay_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          battleId,
          attacker_id,
          defender_id,
          winnerId,
          loserId,
          sim.roundsCount,
          seed,
          JSON.stringify(sim),
          now,
        ]
      );

      return {
        ok: true,
        battleId,
        winnerId,
        loserId,
        drops,
        battle: sim,
      };
    } catch (err) {
      req.log.error(err);
      return reply.code(500).send({
        ok: false,
        error: "battle_failed",
        message: err.message,
      });
    }
  });

  // =============================
  // GET /battle/replay/:id
  // =============================
  app.get("/battle/replay/:id", async (req, reply) => {
    const { id } = req.params;

    const row = app.db.get(
      "SELECT replay_json FROM battles WHERE id=?",
      [id]
    );

    if (!row) {
      return reply.code(404).send({ ok: false, error: "not_found" });
    }

    return {
      ok: true,
      id,
      replay: JSON.parse(row.replay_json || "{}"),
    };
  });
}

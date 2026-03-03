import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";

type SimulateBody = {
  attacker_id: string;
  defender_id: string;
  max_rounds?: number;
};

type BattleReplayParams = {
  id: string;
};

// RNG determinístico simples
function createSeededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export async function battleRoutes(app: FastifyInstance) {
  // ===============================
  // POST /battle/simulate (REAL)
  // ===============================
  app.post<{ Body: SimulateBody }>("/battle/simulate", async (req, reply) => {
    const { attacker_id, defender_id } = req.body;

    const maxRounds = Math.min(req.body.max_rounds ?? 30, 100);

    if (!attacker_id || !defender_id) {
      return reply.code(400).send({
        ok: false,
        error: "invalid_payload",
      });
    }

    // seed determinístico
    const seedInt = Math.floor(Math.random() * 1_000_000_000);
    const rng = createSeededRng(seedInt);

    // stats base (depois vamos puxar do DB/equipment)
    let atkHP = 120;
    let defHP = 120;
    const atk = 12;
    const def = 10;

    const critChance = 0.15;
    const missChance = 0.08;

    const log: any[] = [];

    let round = 0;
    let endedBy = "battle";

    while (atkHP > 0 && defHP > 0 && round < maxRounds) {
      round++;

      // atacante bate
      {
        const miss = rng() < missChance;
        let dmg = 0;
        let crit = false;

        if (!miss) {
          crit = rng() < critChance;
          dmg = Math.max(1, atk - Math.floor(def * 0.4));
          if (crit) dmg = Math.floor(dmg * 1.8);
          defHP -= dmg;
        }

        log.push({
          round,
          who: "attacker",
          attacker_id,
          defender_id,
          dmg,
          crit,
          miss,
          hp_attacker: Math.max(0, atkHP),
          hp_defender: Math.max(0, defHP),
        });

        if (defHP <= 0) break;
      }

      // defensor bate
      {
        const miss = rng() < missChance;
        let dmg = 0;
        let crit = false;

        if (!miss) {
          crit = rng() < critChance;
          dmg = Math.max(1, def - Math.floor(atk * 0.3));
          if (crit) dmg = Math.floor(dmg * 1.8);
          atkHP -= dmg;
        }

        log.push({
          round,
          who: "defender",
          attacker_id: defender_id,
          defender_id: attacker_id,
          dmg,
          crit,
          miss,
          hp_attacker: Math.max(0, atkHP),
          hp_defender: Math.max(0, defHP),
        });
      }
    }

    if (round >= maxRounds) {
      endedBy = "max_rounds";
    }

    const winner = atkHP > defHP ? attacker_id : defender_id;
    const loser = winner === attacker_id ? defender_id : attacker_id;

    const battleId = randomUUID();

    // 🔥 persistência usando SEU WRAPPER
    await app.db.run(
      `
      INSERT INTO battles (
        id,
        attacker_id,
        defender_id,
        winner_id,
        loser_id,
        ended_by,
        rounds_count,
        seed_int,
        max_rounds,
        xp_reward,
        log_json,
        replay_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `,
      [
        battleId,
        attacker_id,
        defender_id,
        winner,
        loser,
        endedBy,
        round,
        seedInt,
        maxRounds,
        20,
        JSON.stringify(log),
        JSON.stringify({ seedInt, log }),
      ]
    );

    return {
      ok: true,
      battleId,
      winner,
      loser,
      battle: {
        seedInt,
        roundsCount: round,
        endedBy,
        xpReward: 20,
        log,
      },
    };
  });

  // ===============================
  // GET /battle/replay/:id (REAL)
  // ===============================
  app.get<{ Params: BattleReplayParams }>(
    "/battle/replay/:id",
    async (req, reply) => {
      const { id } = req.params;

      const row = app.db.get(
        "SELECT replay_json FROM battles WHERE id=?",
        [id]
      );

      if (!row) {
        return reply.code(404).send({
          ok: false,
          error: "not_found",
        });
      }

      return {
        ok: true,
        id,
        replay: JSON.parse(row.replay_json || "{}"),
      };
    }
  );
}

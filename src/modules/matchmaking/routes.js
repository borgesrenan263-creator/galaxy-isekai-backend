import { simulateBattle } from "../battle/engine.js";

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function pickEnemyClass(playerClass) {
  // counter simples (pra portfolio: dá pra explicar em entrevista)
  const map = {
    knight: "mage",
    mage: "rogue",
    rogue: "knight",
    beast: "knight",
  };
  return map[playerClass] || "goblin";
}

function buildEnemyByClass(enemyClass, level) {
  // AI “build” simples via equipment_json (bonuses)
  // (você pode expandir isso depois com item pool)
  const L = clamp(Number(level) || 1, 1, 999);

  const base = {
    knight: { hp: 90, atk: 10, def: 7, crit: 3, spd: 4 },
    rogue:  { hp: 75, atk: 11, def: 4, crit: 6, spd: 7 },
    mage:   { hp: 70, atk: 13, def: 3, crit: 7, spd: 5 },
    beast:  { hp: 85, atk: 12, def: 4, crit: 4, spd: 5 },
    goblin: { hp: 80, atk: 9,  def: 3, crit: 4, spd: 6 },
  }[enemyClass] || { hp: 80, atk: 9, def: 3, crit: 4, spd: 6 };

  const scaled = {
    hp:   Math.round(base.hp  + (L - 1) * 6),
    atk:  Math.round(base.atk + (L - 1) * 1.4),
    def:  Math.round(base.def + (L - 1) * 0.9),
    crit: Math.round(base.crit + (L - 1) * 0.15),
    spd:  Math.round(base.spd + (L - 1) * 0.35),
  };

  // equipment por classe (bônus pequenos, mas visíveis)
  const equipment = (() => {
    if (enemyClass === "knight") {
      return {
        weapon: { name: "Rust Sword", bonus: { atk: 2 } },
        armor:  { name: "Iron Plate", bonus: { def: 2, hp: 10 } },
      };
    }
    if (enemyClass === "rogue") {
      return {
        weapon: { name: "Dagger", bonus: { atk: 1, crit: 5 } },
        boots:  { name: "Light Boots", bonus: { spd: 2 } },
      };
    }
    if (enemyClass === "mage") {
      return {
        weapon: { name: "Dark Staff", bonus: { atk: 3, crit: 3 } },
        robe:   { name: "Mystic Robe", bonus: { hp: 5 } },
      };
    }
    return {
      trinket: { name: "Wild Charm", bonus: { atk: 1, hp: 8 } },
    };
  })();

  return {
    id: `npc:${enemyClass}:L${L}`,
    user_id: "npc",
    name: `NPC ${enemyClass.toUpperCase()}`,
    class: enemyClass,
    level: L,
    hp_current: scaled.hp,
    hp_max: scaled.hp,
    atk: scaled.atk,
    def: scaled.def,
    crit: scaled.crit,
    spd: scaled.spd,
    xp: 0,
    xp_to_next: 100,
    equipment_json: JSON.stringify(equipment),
  };
}

async function getCharacterById(app, id) {
  const db = app.db;
  const stmt = db.prepare("SELECT * FROM characters WHERE id = ?;");
  stmt.bind([id]);
  const ok = stmt.step();
  if (!ok) { stmt.free(); return null; }
  const row = stmt.getAsObject();
  stmt.free();
  return row && row.id ? row : null;
}

export async function matchmakingRoutes(app) {
  app.post("/matchmaking/quick", async (req) => {
    const body = req.body || {};
    const character_id = String(body.character_id || "");
    const seed = (body.seed != null) ? String(body.seed) : `mm-${Date.now()}`;
    const maxRounds = Number(body.maxRounds || 200);

    const player = await getCharacterById(app, character_id);
    if (!player) return { ok: false, error: "character not found" };

    const enemyLevel = clamp((Number(player.level) || 1) + 0, 1, 999);
    const enemyClass = pickEnemyClass(player.class);
    const enemy = buildEnemyByClass(enemyClass, enemyLevel);

    const sim = simulateBattle({
      attacker: player,
      defender: enemy,
      seed,
      maxRounds,
    });

    return {
      ok: true,
      meta: {
        seed,
        enemyClass,
        enemyLevel,
      },
      player: { id: player.id, name: player.name, class: player.class, level: player.level },
      enemy:  { id: enemy.id, name: enemy.name, class: enemy.class, level: enemy.level },
      ...sim,
    };
  });
}

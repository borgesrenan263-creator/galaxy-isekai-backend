import { makeRng, rngInt, clamp } from "../battle/rng.js";
import { getDefaultEquipmentForClass } from "../items/equipment.js";

function buildByClass(cls, lvl, rng) {
  const c = String(cls || "warrior").toLowerCase();

  // builds base (por classe)
  const base = {
    warrior: { hp: 110, atk: 12, def: 7, crit: 6, spd: 5 },
    knight:  { hp: 140, atk: 10, def: 10, crit: 4, spd: 4 },
    rogue:   { hp: 95,  atk: 11, def: 5, crit: 12, spd: 10 },
    mage:    { hp: 85,  atk: 16, def: 4, crit: 8, spd: 6 },
    paladin: { hp: 150, atk: 10, def: 12, crit: 4, spd: 3 },
  }[c] || { hp: 110, atk: 12, def: 7, crit: 6, spd: 5 };

  // scaling consistente
  const L = clamp(Number(lvl || 1), 1, 999);
  const hp = base.hp + L * 10 + rngInt(rng, 0, 10);
  const atk = base.atk + Math.floor(L * 1.6) + rngInt(rng, 0, 3);
  const def = base.def + Math.floor(L * 1.2) + rngInt(rng, 0, 3);
  const crit = clamp(base.crit + Math.floor(L / 8), 0, 25);
  const spd = clamp(base.spd + Math.floor(L / 10), 0, 40);

  return { hp_max: hp, hp_current: hp, atk, def, crit, spd };
}

export async function enemiesRoutes(app) {
  // GET /enemies/generate?level=10&class=rogue&seed=debug-1
  app.get("/enemies/generate", async (req) => {
    const { level = 1, class: cls = "warrior", seed = null } = req.query || {};
    const rng = makeRng(seed);

    const lvl = clamp(Number(level || 1), 1, 999);
    const className = String(cls || "warrior").toLowerCase();

    const stats = buildByClass(className, lvl, rng);

    // equipamento default por classe (NPC também)
    const equipment_json = getDefaultEquipmentForClass(className);

    const enemy = {
      id: `enemy-${Date.now()}`,
      name: `AI ${className.toUpperCase()} Lv${lvl}`,
      class: className,
      level: lvl,
      ...stats,
      equipment_json,
      wins: 0,
      losses: 0,
      last_battle_at: 0,
    };

    return { ok: true, enemy };
  });
}

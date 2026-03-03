import { v4 as uuid } from "uuid";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function scaleEnemy(base, targetLevel) {
  const lvl = clamp(Number(targetLevel || 1), 1, 999);

  // scaling simples mas eficaz:
  const hp = Math.round(base.hp_max * (1 + (lvl - base.level) * 0.08));
  const atk = Math.round(base.atk * (1 + (lvl - base.level) * 0.05));
  const def = Math.round(base.def * (1 + (lvl - base.level) * 0.04));
  const crit = clamp(base.crit + Math.floor((lvl - base.level) / 3), 0, 50);
  const spd = clamp(base.spd + Math.floor((lvl - base.level) / 4), 1, 99);

  return {
    ...base,
    id: uuid(),
    name: `${base.name} Lv${lvl}`,
    level: lvl,
    hp_current: hp,
    hp_max: hp,
    atk,
    def,
    crit,
    spd,
    is_npc: 1,
  };
}

// Busca um enemy “base” do seu DB (se existir tabela enemies), senão gera um dummy.
function getAnyEnemyBase(db) {
  try {
    const stmt = db.prepare("SELECT id, name, class, level, hp_current, hp_max, atk, def, crit, spd FROM enemies LIMIT 1");
    stmt.step();
    const row = stmt.getAsObject();
    stmt.free();
    if (row && row.id) return row;
  } catch {}
  return {
    id: "enemy-base",
    name: "Goblin",
    class: "enemy",
    level: 1,
    hp_current: 80,
    hp_max: 80,
    atk: 7,
    def: 3,
    crit: 3,
    spd: 3,
  };
}

export function pickMatch(db, character) {
  const base = getAnyEnemyBase(db);
  const scaled = scaleEnemy(base, character.level);

  // Recompensa base (pode evoluir depois):
  const xpReward = 25 + Math.floor(character.level * 5);

  return { enemy: scaled, xpReward };
}

import { clamp, rngInt, rngFloat } from "../battle/rng.js";

/**
 * Equipment model:
 * {
 *  id, class, slot, name, rarity,
 *  bonuses: { hp, atk, def, crit, spd },
 *  visual: { icon, color, spriteKey }
 * }
 */

const RARITY = {
  common: { w: 60, color: "#9aa0a6" },
  rare: { w: 25, color: "#4dabf7" },
  epic: { w: 12, color: "#b197fc" },
  legendary: { w: 3, color: "#ffd43b" },
};

const SLOTS = ["weapon", "armor", "ring", "boots"];

function v(className, slot, rarity, icon, spriteKey) {
  return {
    icon,
    color: RARITY[rarity]?.color || "#9aa0a6",
    spriteKey: spriteKey || `${className}_${slot}_${rarity}`.toLowerCase(),
  };
}

function mk(id, className, slot, name, rarity, bonuses, visual) {
  return { id, class: className, slot, name, rarity, bonuses, visual };
}

// 🎮 SET FULL (visuais incluídos)
const CATALOG = [
  // KNIGHT / PALADIN (tank)
  mk("k_wep_ironblade", "knight", "weapon", "Iron Blade", "common", { atk: 2 }, v("knight","weapon","common","🗡️")),
  mk("k_wep_oathbreaker", "knight", "weapon", "Oathbreaker", "epic", { atk: 5, crit: 2 }, v("knight","weapon","epic","🗡️")),
  mk("k_arm_leather", "knight", "armor", "Leather Armor", "common", { def: 2, hp: 6 }, v("knight","armor","common","🛡️")),
  mk("k_arm_aegis", "knight", "armor", "Aegis Plate", "legendary", { def: 8, hp: 18 }, v("knight","armor","legendary","🛡️")),
  mk("k_rng_lucky", "knight", "ring", "Lucky Ring", "rare", { crit: 3 }, v("knight","ring","rare","💍")),
  mk("k_bts_swift", "knight", "boots", "Swift Boots", "rare", { spd: 2 }, v("knight","boots","rare","🥾")),

  // MAGE (glass cannon)
  mk("m_wep_oakwand", "mage", "weapon", "Oak Wand", "common", { atk: 2, crit: 1 }, v("mage","weapon","common","🪄")),
  mk("m_wep_arcane", "mage", "weapon", "Arcane Rod", "epic", { atk: 6, crit: 4 }, v("mage","weapon","epic","🪄")),
  mk("m_arm_silk", "mage", "armor", "Silk Robe", "common", { def: 1, hp: 4, spd: 1 }, v("mage","armor","common","🧥")),
  mk("m_arm_starlight", "mage", "armor", "Starlight Mantle", "legendary", { def: 3, hp: 10, crit: 4 }, v("mage","armor","legendary","🧥")),
  mk("m_rng_focus", "mage", "ring", "Focus Ring", "rare", { crit: 4 }, v("mage","ring","rare","💍")),
  mk("m_bts_phase", "mage", "boots", "Phase Steps", "epic", { spd: 3, crit: 1 }, v("mage","boots","epic","🥾")),

  // ROGUE (spd/crit)
  mk("r_wep_dagger", "rogue", "weapon", "Twin Daggers", "common", { atk: 2, spd: 1 }, v("rogue","weapon","common","🗡️")),
  mk("r_wep_nightfang", "rogue", "weapon", "Nightfang", "legendary", { atk: 5, spd: 3, crit: 6 }, v("rogue","weapon","legendary","🗡️")),
  mk("r_arm_shadow", "rogue", "armor", "Shadow Cloak", "rare", { def: 2, spd: 2 }, v("rogue","armor","rare","🧥")),
  mk("r_arm_voidskin", "rogue", "armor", "Voidskin", "epic", { def: 3, spd: 2, crit: 2 }, v("rogue","armor","epic","🧥")),
  mk("r_rng_edge", "rogue", "ring", "Edge Ring", "epic", { crit: 5 }, v("rogue","ring","epic","💍")),
  mk("r_bts_silent", "rogue", "boots", "Silent Boots", "rare", { spd: 3 }, v("rogue","boots","rare","🥾")),

  // WARRIOR (balanced atk/def)
  mk("w_wep_cleaver", "warrior", "weapon", "Steel Cleaver", "rare", { atk: 4 }, v("warrior","weapon","rare","🪓")),
  mk("w_wep_warcry", "warrior", "weapon", "Warcry Axe", "epic", { atk: 6, def: 1 }, v("warrior","weapon","epic","🪓")),
  mk("w_arm_chain", "warrior", "armor", "Chainmail", "rare", { def: 4, hp: 6 }, v("warrior","armor","rare","🛡️")),
  mk("w_arm_colossus", "warrior", "armor", "Colossus Plate", "legendary", { def: 7, hp: 14, spd: -1 }, v("warrior","armor","legendary","🛡️")),
  mk("w_rng_fury", "warrior", "ring", "Fury Ring", "epic", { atk: 2, crit: 2 }, v("warrior","ring","epic","💍")),
  mk("w_bts_grit", "warrior", "boots", "Grit Boots", "common", { hp: 6 }, v("warrior","boots","common","🥾")),
];

function normalizeClass(cls) {
  const c = String(cls || "").toLowerCase();
  if (["knight","mage","rogue","warrior","paladin"].includes(c)) return c;
  return "warrior";
}

export function getEquipmentCatalog() {
  return CATALOG;
}

export function getCatalogForClass(className) {
  const c = normalizeClass(className);
  return CATALOG.filter(i => i.class === c);
}

export function getDefaultEquipmentForClass(className) {
  const c = normalizeClass(className);
  const by = (slot) => getCatalogForClass(c).find(i => i.slot === slot && i.rarity === "common") || null;
  return {
    weapon: by("weapon"),
    armor: by("armor"),
    ring: by("ring"),
    boots: by("boots"),
  };
}

export function equipmentBonuses(equipmentJson) {
  // equipmentJson pode ser objeto {weapon, armor, ring, boots} ou string JSON
  let eq = equipmentJson;
  if (!eq) return { hp: 0, atk: 0, def: 0, crit: 0, spd: 0 };
  if (typeof eq === "string") {
    try { eq = JSON.parse(eq); } catch { eq = null; }
  }
  if (!eq || typeof eq !== "object") return { hp: 0, atk: 0, def: 0, crit: 0, spd: 0 };

  const sum = { hp: 0, atk: 0, def: 0, crit: 0, spd: 0 };
  for (const slot of SLOTS) {
    const item = eq[slot];
    if (item && item.bonuses) {
      for (const k of Object.keys(sum)) sum[k] += Number(item.bonuses[k] || 0);
    }
  }
  return sum;
}

export function withEquipmentStats(character) {
  const c = { ...(character || {}) };
  const b = equipmentBonuses(c.equipment_json);

  // aplica bônus nos stats base (e garante limites)
  c.hp_max = clamp(Number(c.hp_max || 0) + b.hp, 1, 999999);
  c.hp_current = clamp(Number(c.hp_current ?? c.hp_max) + b.hp, 0, c.hp_max);
  c.atk = clamp(Number(c.atk || 0) + b.atk, 0, 999999);
  c.def = clamp(Number(c.def || 0) + b.def, 0, 999999);
  c.crit = clamp(Number(c.crit || 0) + b.crit, 0, 60);
  c.spd = clamp(Number(c.spd || 0) + b.spd, 0, 999999);

  c.equipment_bonus = b;
  return c;
}

function weightedPick(rng) {
  const roll = rngFloat(rng) * 100;
  let acc = 0;
  for (const r of Object.keys(RARITY)) {
    acc += RARITY[r].w;
    if (roll <= acc) return r;
  }
  return "common";
}

export function rollEquipmentDrop(rng, className, level = 1) {
  const c = normalizeClass(className);
  const rarity = weightedPick(rng);

  // escolhe slot e item do catálogo por classe
  const slot = SLOTS[rngInt(rng, 0, SLOTS.length - 1)];
  const candidates = CATALOG.filter(i => i.class === c && i.slot === slot);

  // tenta pegar mesma raridade; se não existir, pega qualquer
  const same = candidates.filter(i => i.rarity === rarity);
  const pool = same.length ? same : candidates;

  const pick = pool[rngInt(rng, 0, Math.max(0, pool.length - 1))] || null;
  if (!pick) return null;

  // leve scaling por nível (sênior-friendly mas simples)
  const scale = Math.max(1, Math.floor(Number(level || 1) / 10));
  const scaled = {
    ...pick,
    bonuses: {
      hp: Number(pick.bonuses.hp || 0) * scale,
      atk: Number(pick.bonuses.atk || 0) * scale,
      def: Number(pick.bonuses.def || 0) * scale,
      crit: Number(pick.bonuses.crit || 0), // crit não escala agressivo
      spd: Number(pick.bonuses.spd || 0) * scale,
    }
  };

  return scaled;
}

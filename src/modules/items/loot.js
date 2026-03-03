/**
 * Loot helper (engine version)
 * - Uses provided rng() function when available
 */

function safeRng(rng) {
  if (typeof rng === "function") return rng();
  return Math.random();
}

export function nowTs() {
  return Date.now();
}

export function rollDrop(rng) {
  const r = safeRng(rng);

  if (r < 0.05) return { rarity: "epic", item: "Epic Core" };
  if (r < 0.20) return { rarity: "rare", item: "Rare Shard" };
  if (r < 0.60) return { rarity: "common", item: "Common Dust" };
  return null;
}

/**
 * Compat layer (battle expects plural)
 */
export function rollDrops(rng) {
  const drop = rollDrop(rng);
  return drop ? [drop] : [];
}

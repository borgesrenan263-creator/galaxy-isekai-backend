/**
 * RNG helper (deterministic safe)
 */

export function seedToInt(seed) {
  if (seed === undefined || seed === null || seed === "") return 0;
  const s = String(seed);
  let h = 2166136261; // FNV-1a-ish
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}

export function makeRng(seed) {
  const seedInt = seedToInt(seed);
  if (!seedInt) return null;

  let t = (seedInt >>> 0) || 1;
  return function rng() {
    // mulberry32-ish
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFloat(rng) {
  if (typeof rng === "function") return rng();
  return Math.random();
}

export function rngInt(rng, min, max) {
  const r = rngFloat(rng);
  return Math.floor(r * (max - min + 1)) + min;
}

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

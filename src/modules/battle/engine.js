/**
 * Battle Engine (deterministic with seed)
 */
import { makeRng, seedToInt, rngFloat, clamp } from "./rng.js";
import { withEquipmentStats } from "../items/equipment.js";

export function rollChance(rng, pct) {
  const p = clamp(Number(pct || 0), 0, 100) / 100;
  return rngFloat(rng) < p;
}

export function calcDamage(attacker, defender, rng, opts = {}) {
  const missChance = clamp(Number(opts.missChance ?? 8), 0, 60); // %
  if (rollChance(rng, missChance)) return { miss: true, dmg: 0, crit: false };

  const critChance = clamp(Number(opts.critChance ?? attacker.crit ?? 5), 0, 60); // %
  const isCrit = rollChance(rng, critChance);

  const variance = 0.9 + rngFloat(rng) * 0.2; // 0.9..1.1
  const baseAtk = Math.max(0, Number(attacker.atk || 0));
  const baseDef = Math.max(0, Number(defender.def || 0));
  const raw = Math.max(1, Math.floor((baseAtk - baseDef * 0.35) * variance));

  const critMult = isCrit ? 1.6 : 1.0;
  const dmg = Math.max(1, Math.floor(raw * critMult));

  return { miss: false, dmg, crit: isCrit };
}

export function simulateBattle(attacker, defender, seed = null, maxRounds = 200) {
  // ✅ aplica equipment antes de qualquer coisa
  const A = withEquipmentStats(attacker);
  const B = withEquipmentStats(defender);

  const seedInt = seedToInt(seed);
  const rng = makeRng(seedInt || 1);

  const RMAX = clamp(Number(maxRounds || 200), 1, 2000);

  let aHp = clamp(Number(A.hp_current ?? A.hp_max), 0, Number(A.hp_max || 1));
  let bHp = clamp(Number(B.hp_current ?? B.hp_max), 0, Number(B.hp_max || 1));

  // quem começa: maior spd; empate -> rng
  let turn = (A.spd > B.spd) ? "A" : (B.spd > A.spd ? "B" : (rngFloat(rng) < 0.5 ? "A" : "B"));

  const rounds = [];
  let endedBy = "max_rounds";

  for (let i = 1; i <= RMAX; i++) {
    if (aHp <= 0 || bHp <= 0) break;

    const atk = (turn === "A") ? A : B;
    const def = (turn === "A") ? B : A;

    const out = calcDamage(atk, def, rng, {
      missChance: 8,
      critChance: atk.crit,
    });

    if (turn === "A") {
      bHp = clamp(bHp - out.dmg, 0, Number(B.hp_max || 1));
      rounds.push({ round: i, by: A.id, to: B.id, dmg: out.dmg, crit: out.crit, miss: out.miss, a_hp: aHp, b_hp: bHp });
    } else {
      aHp = clamp(aHp - out.dmg, 0, Number(A.hp_max || 1));
      rounds.push({ round: i, by: B.id, to: A.id, dmg: out.dmg, crit: out.crit, miss: out.miss, a_hp: aHp, b_hp: bHp });
    }

    if (aHp <= 0 || bHp <= 0) { endedBy = "ko"; break; }
    turn = (turn === "A") ? "B" : "A";
  }

  const winner = (aHp > 0 && bHp <= 0) ? A.id : (bHp > 0 && aHp <= 0 ? B.id : (aHp >= bHp ? A.id : B.id));
  const loser  = (winner === A.id) ? B.id : A.id;

  return {
    meta: { seed, seedInt, maxRounds: RMAX, roundsCount: rounds.length },
    start: { a_hp: Number(A.hp_current ?? A.hp_max), b_hp: Number(B.hp_current ?? B.hp_max) },
    end: { a_hp: aHp, b_hp: bHp, endedBy },
    battle: { attacker: { id: A.id, name: A.name }, defender: { id: B.id, name: B.name }, winnerId: winner, loserId: loser },
    rounds,
    // debug: bônus aplicados
    equipment: {
      attacker: A.equipment_bonus || { hp:0,atk:0,def:0,crit:0,spd:0 },
      defender: B.equipment_bonus || { hp:0,atk:0,def:0,crit:0,spd:0 },
    }
  };
}

// replay compactado (base)
export function compactReplay(sim) {
  // formato compacto: array de [byIsA, dmg, flags] onde flags: bit0=crit bit1=miss
  // byIsA: 1 se atacante original, 0 se defensor original
  const atkId = sim?.battle?.attacker?.id;
  const out = [];
  for (const r of (sim.rounds || [])) {
    const byIsA = (r.by === atkId) ? 1 : 0;
    const flags = (r.crit ? 1 : 0) | (r.miss ? 2 : 0);
    out.push([byIsA, Number(r.dmg || 0), flags]);
  }
  return {
    v: 1,
    seed: sim?.meta?.seed ?? null,
    maxRounds: sim?.meta?.maxRounds ?? 200,
    start: sim?.start || null,
    end: sim?.end || null,
    p: out
  };
}

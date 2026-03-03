/**
 * Equipment routes (SEM conflito com /characters/:id/equipment)
 *
 * Endpoints:
 *  GET  /equipment/characters/:id
 *  POST /equipment/characters/:id
 *  GET  /equipment/catalog
 */

import { parseEquipment } from "../items/equipment.js";

function safeJsonParse(str, fallback) {
  try {
    const v = JSON.parse(str);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export async function equipmentRoutes(app) {
  // 1) pegar equipment do personagem (rota SEM conflito)
  app.get("/equipment/characters/:id", async (req, reply) => {
    const { id } = req.params;

    const row = await app.db.get(
      "SELECT id, name, equipment_json FROM characters WHERE id = ?",
      [id]
    );

    if (!row) {
      reply.code(404);
      return { ok: false, error: "character not found" };
    }

    const equipment = parseEquipment(row.equipment_json);

    return {
      ok: true,
      character: { id: row.id, name: row.name },
      equipment,
    };
  });

  // 2) set equipment do personagem (rota SEM conflito)
  app.post("/equipment/characters/:id", async (req, reply) => {
    const { id } = req.params;

    const row = await app.db.get(
      "SELECT id, name, equipment_json FROM characters WHERE id = ?",
      [id]
    );

    if (!row) {
      reply.code(404);
      return { ok: false, error: "character not found" };
    }

    const body = req.body || {};
    const nextEquip =
      Array.isArray(body.equipment) ? body.equipment : safeJsonParse(body.equipment_json, null);

    if (!Array.isArray(nextEquip)) {
      reply.code(400);
      return { ok: false, error: "invalid equipment (expected array in equipment)" };
    }

    const equipment_json = JSON.stringify(nextEquip);

    await app.db.run(
      "UPDATE characters SET equipment_json = ?, updated_at = ? WHERE id = ?",
      [equipment_json, new Date().toISOString(), id]
    );

    return {
      ok: true,
      character: { id: row.id, name: row.name },
      equipment: nextEquip,
    };
  });

  // 3) catálogo simples (placeholder)
  app.get("/equipment/catalog", async () => {
    return {
      ok: true,
      items: [
        { slot: "weapon", name: "Iron Sword", bonuses: { atk: 2 } },
        { slot: "armor", name: "Leather Armor", bonuses: { def: 1, hp: 10 } },
        { slot: "ring", name: "Lucky Ring", bonuses: { crit: 2 } },
        { slot: "boots", name: "Swift Boots", bonuses: { spd: 1 } },
      ],
    };
  });
}

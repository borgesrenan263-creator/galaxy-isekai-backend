import { v4 as uuid } from "uuid";
import { classStats } from "./classStats.js";

export async function characterRoutes(app) {
  // criar personagem
  app.post("/characters", async (req, reply) => {
    const { name, class: clazz } = req.body || {};

    if (!name || !clazz) {
      return reply.code(400).send({
        ok: false,
        error: "name and class required",
      });
    }

    const base = classStats[clazz];
    if (!base) {
      return reply.code(400).send({
        ok: false,
        error: "invalid class",
      });
    }

    const id = uuid();
    const now = Date.now();

    app.db.run(
      `INSERT INTO characters
      (id,user_id,name,class,level,hp_current,hp_max,atk,def,crit,spd,xp,xp_to_next,wins,losses,last_battle_at,equipment_json,last_heal_at,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        "local",
        name,
        clazz,
        1,
        base.hp,
        base.hp,
        base.atk,
        base.def,
        base.crit,
        base.spd,
        0,
        100,
        0,
        0,
        0,
        "{}",
        0,
        now,
        now,
      ]
    );

    return { ok: true, id };
  });

  // listar personagens
  app.get("/characters", async () => {
    const rows = app.db.all(
      "SELECT id,name,class,level,hp_current,hp_max,atk,def,crit,spd,xp,xp_to_next,wins,losses,last_battle_at FROM characters"
    );
    return { ok: true, characters: rows };
  });

  // heal simples
  app.post("/characters/:id/heal", async (req, reply) => {
    const { id } = req.params;

    const rows = app.db.all(
      "SELECT id,hp_current,hp_max FROM characters WHERE id=?",
      [id]
    );

    const c = rows[0];
    if (!c) {
      return reply.code(404).send({ ok: false, error: "not found" });
    }

    const now = Date.now();

    app.db.run(
      "UPDATE characters SET hp_current=?, last_heal_at=?, updated_at=? WHERE id=?",
      [c.hp_max, now, now, id]
    );

    return { ok: true, hp: c.hp_max };
  });
}

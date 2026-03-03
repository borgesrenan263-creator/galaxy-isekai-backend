export function ensureColumns(db) {
  // helper: cria colunas sem quebrar DB existente
  function hasColumn(table, col) {
    const stmt = db.prepare(`PRAGMA table_info(${table});`);
    let found = false;
    while (stmt.step()) {
      const row = stmt.getAsObject();
      if (row.name === col) { found = true; break; }
    }
    stmt.free();
    return found;
  }

  function addColumn(table, colDef) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef};`);
  }

  // characters: equipment_json + last_heal_at
  if (hasColumn("characters", "id")) {
    if (!hasColumn("characters", "equipment_json")) {
      addColumn("characters", `equipment_json TEXT NOT NULL DEFAULT '[]'`);
    }
    if (!hasColumn("characters", "last_heal_at")) {
      addColumn("characters", `last_heal_at INTEGER NOT NULL DEFAULT 0`);
    }
  }

  // enemies: equipment_json (pra AI builds tbm)
  if (hasColumn("enemies", "id")) {
    if (!hasColumn("enemies", "equipment_json")) {
      addColumn("enemies", `equipment_json TEXT NOT NULL DEFAULT '[]'`);
    }
  }
}

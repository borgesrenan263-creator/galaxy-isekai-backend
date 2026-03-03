export function migrate(db) {
  // helper: checa se coluna existe
  const hasColumn = (table, col) => {
    const res = db.exec(`PRAGMA table_info(${table});`);
    if (!res?.[0]?.values) return false;
    return res[0].values.some((row) => row[1] === col);
  };

  // characters: updated_at
  if (!hasColumn("characters", "updated_at")) {
    db.exec(`ALTER TABLE characters ADD COLUMN updated_at TEXT;`);
  }

  // XP system
  if (!hasColumn("characters", "xp")) {
    db.exec(`ALTER TABLE characters ADD COLUMN xp INTEGER DEFAULT 0;`);
  }
  if (!hasColumn("characters", "xp_to_next")) {
    db.exec(`ALTER TABLE characters ADD COLUMN xp_to_next INTEGER DEFAULT 100;`);
  }

  // garante valores (caso existam nulos)
  db.exec(`
    UPDATE characters
    SET xp = COALESCE(xp, 0),
        xp_to_next = COALESCE(xp_to_next, 100),
        updated_at = COALESCE(updated_at, created_at)
  `);
}

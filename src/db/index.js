/**
 * DB (sql.js) - wrapper simples e estável
 * - Persiste em ./dev.db
 * - Fornece: get, all, run
 */

import fs from "node:fs";
import path from "node:path";
import initSqlJs from "sql.js";

const DB_FILE = path.resolve(process.cwd(), "dev.db");

function nowIso() {
  return new Date().toISOString();
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadFileBytes(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}

function persist(db) {
  try {
    ensureDir(DB_FILE);
    const data = db.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  } catch (e) {
    // não crashar a API por falha de escrita
    console.error("DB persist error:", e?.message || e);
  }
}

function stmtBind(stmt, params) {
  if (!params) return;
  if (Array.isArray(params)) stmt.bind(params);
  else stmt.bind([params]);
}

function runAll(stmt) {
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  return rows;
}

function normalizeRow(row) {
  if (!row) return null;
  // sql.js pode retornar undefined em colunas ausentes
  return row;
}

async function migrate(db) {
  // characters
  db.run(`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT,
      class TEXT,
      level INTEGER,
      hp_current INTEGER,
      hp_max INTEGER,
      atk INTEGER,
      def INTEGER,
      crit INTEGER,
      spd INTEGER,
      xp INTEGER,
      xp_to_next INTEGER,
      wins INTEGER,
      losses INTEGER,
      last_battle_at INTEGER,
      last_heal_at INTEGER,
      equipment_json TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  // battles (history)
  db.run(`
    CREATE TABLE IF NOT EXISTS battles (
      id TEXT PRIMARY KEY,
      attacker_id TEXT,
      defender_id TEXT,
      winner_id TEXT,
      loser_id TEXT,
      ended_by TEXT,
      rounds_count INTEGER,
      seed TEXT,
      seed_int INTEGER,
      max_rounds INTEGER,
      xp_reward INTEGER,
      log_json TEXT,
      created_at TEXT
    );
  `);

  // seasonal leaderboard base (placeholder)
  db.run(`
    CREATE TABLE IF NOT EXISTS seasons (
      id TEXT PRIMARY KEY,
      name TEXT,
      starts_at TEXT,
      ends_at TEXT,
      created_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS season_scores (
      season_id TEXT,
      character_id TEXT,
      wins INTEGER,
      losses INTEGER,
      updated_at TEXT,
      PRIMARY KEY (season_id, character_id)
    );
  `);
}

export async function initDb() {
  const SQL = await initSqlJs();
  const fileBytes = loadFileBytes(DB_FILE);

  const db = fileBytes ? new SQL.Database(fileBytes) : new SQL.Database();

  await migrate(db);

  // wrapper
  const api = {
    _db: db,

    get(sql, params = []) {
      const stmt = db.prepare(sql);
      try {
        stmtBind(stmt, params);
        const row = stmt.step() ? stmt.getAsObject() : null;
        return normalizeRow(row);
      } finally {
        stmt.free();
      }
    },

    all(sql, params = []) {
      const stmt = db.prepare(sql);
      try {
        stmtBind(stmt, params);
        return runAll(stmt).map(normalizeRow);
      } finally {
        stmt.free();
      }
    },

    run(sql, params = []) {
      const stmt = db.prepare(sql);
      try {
        stmtBind(stmt, params);
        stmt.step();
      } finally {
        stmt.free();
      }
      persist(db);
      return { ok: true };
    },
  };

  // salva DB inicial (se estava vazio)
  persist(db);

  return api;
}

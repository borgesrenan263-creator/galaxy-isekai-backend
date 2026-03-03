-- Galaxy Isekai Protocol - extra tables (items, inventory, drops)
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL, -- common|uncommon|rare|epic|legendary
  slot TEXT NOT NULL,   -- weapon|armor|ring|consumable
  atk_bonus INTEGER NOT NULL DEFAULT 0,
  def_bonus INTEGER NOT NULL DEFAULT 0,
  hp_bonus  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  equipped INTEGER NOT NULL DEFAULT 0, -- 0/1
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_character_id ON inventory(character_id);

CREATE TABLE IF NOT EXISTS battle_drops (
  id TEXT PRIMARY KEY,
  battle_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_battle_drops_battle_id ON battle_drops(battle_id);

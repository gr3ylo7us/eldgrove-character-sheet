import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@shared/schema";
import path from "path";
import fs from "fs";

// Support both local file DB and remote Turso
const dbUrl = process.env.DATABASE_URL || (() => {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return `file:${path.join(dataDir, "eldgrove.db")}`;
})();

const client = createClient({
  url: dbUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Auto-create tables if they don't exist
await client.executeMultiple(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    access_tier TEXT DEFAULT 'free',
    stripe_customer_id TEXT,
    patreon_id TEXT,
    access_key_used TEXT,
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS access_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    created_at INTEGER,
    redeemed_by TEXT,
    redeemed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    name TEXT NOT NULL,
    race TEXT DEFAULT '',
    archetype TEXT DEFAULT '',
    level INTEGER DEFAULT 1,
    progress INTEGER DEFAULT 0,
    power INTEGER DEFAULT 1,
    finesse INTEGER DEFAULT 1,
    vitality INTEGER DEFAULT 1,
    acumen INTEGER DEFAULT 1,
    diplomacy INTEGER DEFAULT 1,
    intuition INTEGER DEFAULT 1,
    talent INTEGER DEFAULT 0,
    moxie INTEGER DEFAULT 1,
    audacity INTEGER DEFAULT 1,
    seele_max INTEGER DEFAULT 9,
    seele_current INTEGER DEFAULT 9,
    renown INTEGER DEFAULT 0,
    karma INTEGER DEFAULT 0,
    wounds_current INTEGER DEFAULT 0,
    skulk_max INTEGER DEFAULT 0,
    skulk_current INTEGER DEFAULT 0,
    armor_name TEXT DEFAULT '',
    armor_protection INTEGER DEFAULT 0,
    armor_evasion_dice INTEGER DEFAULT 1,
    armor_effects TEXT DEFAULT '',
    skill_tiers TEXT DEFAULT '{}',
    equipped_weapons TEXT DEFAULT '[]',
    known_languages TEXT DEFAULT '[]',
    known_feats TEXT DEFAULT '[]',
    known_maneuvers TEXT DEFAULT '[]',
    inventory TEXT DEFAULT '[]',
    archetype_features TEXT DEFAULT '[]',
    selected_archetypes TEXT DEFAULT '[]',
    notes TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS weapons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT,
    dice INTEGER DEFAULT 0,
    mastery TEXT,
    normal_damage INTEGER DEFAULT 0,
    crit_damage INTEGER DEFAULT 0,
    attacks INTEGER DEFAULT 0,
    damage_type TEXT,
    effects TEXT,
    upgrade_effects TEXT,
    occupied_slot TEXT,
    keyword TEXT,
    keyword_effect TEXT
  );

  CREATE TABLE IF NOT EXISTS armor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    protection INTEGER DEFAULT 0,
    evasion_dice INTEGER DEFAULT 1,
    effects TEXT
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rarity INTEGER DEFAULT 0,
    bonuses TEXT,
    category TEXT DEFAULT 'general',
    description TEXT,
    effects TEXT,
    usage_dice TEXT
  );

  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    stat TEXT,
    category TEXT,
    spirit_stat TEXT,
    overview TEXT
  );

  CREATE TABLE IF NOT EXISTS archetypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    tier TEXT,
    features TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS feats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    effect TEXT,
    feat_type TEXT,
    prerequisites TEXT
  );

  CREATE TABLE IF NOT EXISTS maneuvers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    effect TEXT,
    seele_cost TEXT,
    prerequisite TEXT
  );

  CREATE TABLE IF NOT EXISTS languages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    domain TEXT,
    effect TEXT,
    commands TEXT,
    difficulty INTEGER DEFAULT 3,
    tags TEXT,
    damage TEXT,
    counters TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS leveling_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT NOT NULL,
    bonuses TEXT
  );
`);

export const db = drizzle(client, { schema });

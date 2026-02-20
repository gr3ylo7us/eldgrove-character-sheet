import { db } from "./db";
import { weapons, armor, items, skills, feats, maneuvers, languages, archetypes, levelingTable, characters } from "@shared/schema";
import fs from "fs";
import path from "path";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function splitCSVRows(content: string): string[] {
  const rows: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < content.length && content[i + 1] === '"') {
        current += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      current += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && i + 1 < content.length && content[i + 1] === '\n') i++;
      if (current.trim()) rows.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) rows.push(current);
  return rows;
}

function readCSV(filename: string): string[][] {
  const filePath = path.join(process.cwd(), "data", "csv", filename);
  const content = fs.readFileSync(filePath, "utf-8");
  return splitCSVRows(content).map(parseCSVLine);
}

function cleanName(n: string): string {
  return n.replace(/[\u2694\uFE0F\uD83C\uDFF9\u26A1\u2728]/gu, "").trim();
}

function safeInt(v: string | undefined): number {
  if (!v) return 0;
  const n = parseInt(v);
  return isNaN(n) ? 0 : n;
}

function cleanFeature(s: string | undefined): string {
  if (!s) return "";
  return s.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}

async function seedArchetypes() {
  const archRows = readCSV("ELDGROVE [CHARSHEET_BETA_v1.0] - ARCHETYPES.csv");
  const archData: any[] = [];
  for (let i = 1; i < archRows.length; i++) {
    const r = archRows[i];
    if (r[0] && r[0].trim() !== "" && r[0].trim() !== "Initiate Archetype" && r[0].trim() !== ",") {
      const name = r[0].replace(/,/g, "").trim();
      if (name.length > 0 && name.length < 40) {
        const featureList = [cleanFeature(r[1]), cleanFeature(r[2])].filter(f => f.length > 0);
        archData.push({ name, tier: "Initiate", features: featureList });
      }
    }
    if (r[3] && r[3].trim() !== "" && r[3].trim() !== "Acolyte Archetype" && r[3].trim() !== ",") {
      const name = r[3].replace(/,/g, "").trim();
      if (name.length > 0 && name.length < 40) {
        const featureList = [cleanFeature(r[4]), cleanFeature(r[5]), cleanFeature(r[6])].filter(f => f.length > 0);
        archData.push({ name, tier: "Acolyte", features: featureList });
      }
    }
    if (r[7] && r[7].trim() !== "" && r[7].trim() !== "Scholar Archetype" && r[7].trim() !== ",") {
      const name = r[7].replace(/,/g, "").trim();
      if (name.length > 0 && name.length < 40) {
        const featureList = [cleanFeature(r[8]), cleanFeature(r[9]), cleanFeature(r[10]), cleanFeature(r[11])].filter(f => f.length > 0);
        archData.push({ name, tier: "Scholar", features: featureList });
      }
    }
  }
  if (archData.length > 0) await db.insert(archetypes).values(archData);
  console.log(`Re-seeded ${archData.length} archetypes`);
}

export async function seedDatabase() {
  const existingArchetypes = await db.select().from(archetypes);
  if (existingArchetypes.length === 0) {
    await seedArchetypes();
  }

  const existingWeapons = await db.select().from(weapons);
  if (existingWeapons.length > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  console.log("Seeding database...");

  // WEAPONS
  const weaponRows = readCSV("ELDGROVE [CHARSHEET_BETA_v1.0] - WEAPONS.csv");
  const weaponData: any[] = [];
  for (let i = 1; i < weaponRows.length; i++) {
    const r = weaponRows[i];
    if (!r[0] || r[0].trim() === "" || r[0].trim() === ",") continue;
    const name = cleanName(r[0]);
    if (!name || name.length < 2 || name.length > 40) continue;
    if (!r[1] || r[1].trim() === "") continue;
    const type = r[1].trim();
    if (!type.includes("Weapon") && !type.includes("Explosive")) continue;
    weaponData.push({
      name,
      type: r[1] || null,
      dice: safeInt(r[2]),
      mastery: r[3] || null,
      normalDamage: safeInt(r[4]),
      critDamage: safeInt(r[5]),
      attacks: safeInt(r[6]),
      damageType: r[7] || null,
      effects: r[8] || null,
      upgradeEffects: r[9] || null,
      occupiedSlot: r[10] || null,
      keyword: r[11] || null,
      keywordEffect: r[12] || null,
    });
  }
  if (weaponData.length > 0) await db.insert(weapons).values(weaponData);
  console.log(`Seeded ${weaponData.length} weapons`);

  // ARMOR
  const armorRows = readCSV("ELDGROVE [CHARSHEET_BETA_v1.0] - ARMOR.csv");
  const armorData: any[] = [];
  for (let i = 1; i < armorRows.length; i++) {
    const r = armorRows[i];
    if (!r[0] || r[0].trim() === "") continue;
    armorData.push({
      name: r[0].trim(),
      protection: safeInt(r[1]),
      evasionDice: safeInt(r[2]),
      effects: r[3] || null,
    });
  }
  if (armorData.length > 0) await db.insert(armor).values(armorData);
  console.log(`Seeded ${armorData.length} armor`);

  // ITEMS (general items from first columns)
  const itemRows = readCSV("ELDGROVE [CHARSHEET_BETA_v1.0] - ITEMS.csv");
  const itemData: any[] = [];
  for (let i = 1; i < itemRows.length; i++) {
    const r = itemRows[i];
    if (r[0] && r[0].trim() !== "") {
      itemData.push({
        name: r[0].trim(),
        rarity: safeInt(r[1]),
        bonuses: r[2] || null,
        category: "general",
        description: null,
        effects: null,
        usageDice: null,
      });
    }
    if (r[9] && r[9].trim() !== "") {
      itemData.push({
        name: r[9].trim(),
        rarity: safeInt(r[10]),
        bonuses: null,
        category: "curio",
        description: r[11] || null,
        effects: r[12] || null,
        usageDice: r[16] || null,
      });
    }
  }
  if (itemData.length > 0) await db.insert(items).values(itemData);
  console.log(`Seeded ${itemData.length} items`);

  // SKILLS
  const skillRows = readCSV("ELDGROVE [CHARSHEET_BETA_v1.0] - SKILLS.csv");
  const skillData: any[] = [];
  for (let i = 1; i < skillRows.length; i++) {
    const r = skillRows[i];
    if (!r[1] || r[1].trim() === "") continue;
    skillData.push({
      name: r[1].trim(),
      stat: r[2] || null,
      category: r[3] || null,
      spiritStat: r[4] || null,
      overview: r[5] || null,
    });
  }
  if (skillData.length > 0) await db.insert(skills).values(skillData);
  console.log(`Seeded ${skillData.length} skills`);

  // FEATS & MANEUVERS
  const featRows = readCSV("ELDGROVE [CHARSHEET_BETA_v1.0] - FEATS AND MANEUVERS.csv");
  const featData: any[] = [];
  const maneuverData: any[] = [];
  for (let i = 2; i < featRows.length; i++) {
    const r = featRows[i];
    if (r[1] && r[1].trim() !== "" && r[1].trim() !== "FEAT") {
      featData.push({
        name: r[1].trim(),
        effect: r[2] || null,
        featType: r[3] || null,
        prerequisites: r[4] || null,
      });
    }
    if (r[7] && r[7].trim() !== "" && r[7].trim() !== "MANEUVER") {
      maneuverData.push({
        name: r[7].trim(),
        effect: r[8] || null,
        seeleCost: r[9] || null,
        prerequisite: r[10] || null,
      });
    }
    if (r[11] && r[11].trim() !== "" && r[11].trim() !== "MANEUVER") {
      maneuverData.push({
        name: r[11].trim(),
        effect: r[12] || null,
        seeleCost: r[13] || null,
        prerequisite: null,
      });
    }
  }
  if (featData.length > 0) await db.insert(feats).values(featData);
  if (maneuverData.length > 0) await db.insert(maneuvers).values(maneuverData);
  console.log(`Seeded ${featData.length} feats, ${maneuverData.length} maneuvers`);

  // LANGUAGES
  const langRows = readCSV("ELDGROVE [CHARSHEET_BETA_v1.0] - LANGUAGES.csv");
  const langData: any[] = [];
  for (let i = 3; i < langRows.length; i++) {
    const r = langRows[i];
    if (!r[1] || r[1].trim() === "" || r[1].trim() === "Language") continue;
    langData.push({
      name: r[1].trim(),
      domain: r[2] || null,
      effect: r[3] || null,
      commands: r[4] || null,
      difficulty: safeInt(r[5]),
      tags: r[6] || null,
      damage: r[7] || null,
      counters: {},
    });
  }
  if (langData.length > 0) await db.insert(languages).values(langData);
  console.log(`Seeded ${langData.length} languages`);

  // ARCHETYPES (seeded separately via seedArchetypes)

  // LEVELING TABLE
  const levelRows = readCSV("ELDGROVE [CHARSHEET_BETA_v1.0] - LEVELING TABLE.csv");
  const levelData: any[] = [];
  for (let i = 2; i < levelRows.length; i++) {
    const r = levelRows[i];
    if (r[0] === undefined || r[0].trim() === "") continue;
    levelData.push({
      level: r[0].trim(),
      bonuses: r[1] || null,
    });
  }
  if (levelData.length > 0) await db.insert(levelingTable).values(levelData);
  console.log(`Seeded ${levelData.length} leveling entries`);

  // SAMPLE CHARACTER
  const existingChars = await db.select().from(characters);
  if (existingChars.length === 0) {
    await db.insert(characters).values({
      userId: "local-dev-user",
      name: "Ashren Voss",
      race: "Human",
      archetype: "Mage",
      level: 3,
      progress: 3,
      power: 1, finesse: 6, vitality: 2, acumen: 4, diplomacy: 1, intuition: 2, talent: 0, moxie: 1, audacity: 1,
      seeleMax: 9, seeleCurrent: 9,
      renown: 0, karma: 0,
      woundsCurrent: 0,
      armorName: "Rusted Plate",
      armorProtection: 3,
      armorEvasionDice: 1,
      armorEffects: "When taking the DEFEND action, normal successes on your EVADE dice can be used to block critical successes on attacks.",
      skillTiers: {
        "Melee Mastery": 3,
        "Ranged Mastery": 1,
        "Arcane Mastery": 1,
        "Skullduggery": 0,
      },
      equippedWeapons: [
        { name: "Steel Longsword", type: "Melee Weapon", dice: 3, mastery: "Melee Mastery", normalDamage: 3, critDamage: 5, attacks: 1, damageType: "Piercing, Bludgeoning, Slashing", effects: "Grappling 2, Balanced, Silent" },
        { name: "Flintlock Rifle", type: "Blackpowder Weapon", dice: 4, mastery: "Ranged Mastery", normalDamage: 3, critDamage: 4, attacks: 0, damageType: "Piercing", effects: "Blackpowder, Anti-material 3" },
        { name: "Flintlock Pistol", type: "Blackpowder Weapon", dice: 3, mastery: "Ranged Mastery", normalDamage: 3, critDamage: 4, attacks: 0, damageType: "Piercing", effects: "Blackpowder, Anti-material 3" },
        { name: "Steel Tomahawk", type: "Melee Weapon", dice: 1, mastery: "Both", normalDamage: 3, critDamage: 5, attacks: 0, damageType: "Slashing", effects: "Throwable, Off-hand" },
      ],
      knownLanguages: ["Vietar", "Strela", "Telos", "Marak"],
      knownFeats: ["Lucky"],
      knownManeuvers: ["The Long Breath Doctrine:  Third Lung", "Evasive Maneuver", "Riposte", "Cleaving Blow"],
      inventory: [
        { name: "Backpack", description: "Can carry additional small items" },
        { name: "Healing Draught", description: "Recover 1d6 Wounds/HP" },
      ],
      archetypeFeatures: [
        "Magical Education: Learn two Languages.",
        "Arcane Instruction: Open Sixth Sense, Arcane Mastery, Interfacing, Instinct, Edge, and 3 Knowledge skills of your choosing."
      ],
      notes: "",
    });
    console.log("Seeded sample character: Ashren Voss");
  }

  console.log("Seed complete!");
}

// Table name mapping for re-seed operations
const TABLE_MAP: Record<string, { table: any; csvFile: string; seeder: (rows: string[][]) => any[] }> = {
  weapons: {
    table: weapons,
    csvFile: "ELDGROVE [CHARSHEET_BETA_v1.0] - WEAPONS.csv",
    seeder: (rows) => {
      const data: any[] = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r[0] || r[0].trim() === "" || r[0].trim() === ",") continue;
        const name = cleanName(r[0]);
        if (!name || name.length < 2 || name.length > 40) continue;
        if (!r[1] || r[1].trim() === "") continue;
        const type = r[1].trim();
        if (!type.includes("Weapon") && !type.includes("Explosive")) continue;
        data.push({
          name, type: r[1] || null, dice: safeInt(r[2]), mastery: r[3] || null,
          normalDamage: safeInt(r[4]), critDamage: safeInt(r[5]), attacks: safeInt(r[6]),
          damageType: r[7] || null, effects: r[8] || null, upgradeEffects: r[9] || null,
          occupiedSlot: r[10] || null, keyword: r[11] || null, keywordEffect: r[12] || null,
        });
      }
      return data;
    },
  },
  armor: {
    table: armor,
    csvFile: "ELDGROVE [CHARSHEET_BETA_v1.0] - ARMOR.csv",
    seeder: (rows) => {
      const data: any[] = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r[0] || r[0].trim() === "") continue;
        data.push({ name: r[0].trim(), protection: safeInt(r[1]), evasionDice: safeInt(r[2]), effects: r[3] || null });
      }
      return data;
    },
  },
  items: {
    table: items,
    csvFile: "ELDGROVE [CHARSHEET_BETA_v1.0] - ITEMS.csv",
    seeder: (rows) => {
      const data: any[] = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (r[0] && r[0].trim() !== "") {
          data.push({ name: r[0].trim(), rarity: safeInt(r[1]), bonuses: r[2] || null, category: "general", description: null, effects: null, usageDice: null });
        }
        if (r[9] && r[9].trim() !== "") {
          data.push({ name: r[9].trim(), rarity: safeInt(r[10]), bonuses: null, category: "curio", description: r[11] || null, effects: r[12] || null, usageDice: r[16] || null });
        }
      }
      return data;
    },
  },
  skills: {
    table: skills,
    csvFile: "ELDGROVE [CHARSHEET_BETA_v1.0] - SKILLS.csv",
    seeder: (rows) => {
      const data: any[] = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r[1] || r[1].trim() === "") continue;
        data.push({ name: r[1].trim(), stat: r[2] || null, category: r[3] || null, spiritStat: r[4] || null, overview: r[5] || null });
      }
      return data;
    },
  },
  archetypes: {
    table: archetypes,
    csvFile: "ELDGROVE [CHARSHEET_BETA_v1.0] - ARCHETYPES.csv",
    seeder: (rows) => {
      const data: any[] = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (r[0] && r[0].trim() !== "" && r[0].trim() !== "Initiate Archetype" && r[0].trim() !== ",") {
          const name = r[0].replace(/,/g, "").trim();
          if (name.length > 0 && name.length < 40) {
            data.push({ name, tier: "Initiate", features: [cleanFeature(r[1]), cleanFeature(r[2])].filter(f => f.length > 0) });
          }
        }
        if (r[3] && r[3].trim() !== "" && r[3].trim() !== "Acolyte Archetype" && r[3].trim() !== ",") {
          const name = r[3].replace(/,/g, "").trim();
          if (name.length > 0 && name.length < 40) {
            data.push({ name, tier: "Acolyte", features: [cleanFeature(r[4]), cleanFeature(r[5]), cleanFeature(r[6])].filter(f => f.length > 0) });
          }
        }
        if (r[7] && r[7].trim() !== "" && r[7].trim() !== "Scholar Archetype" && r[7].trim() !== ",") {
          const name = r[7].replace(/,/g, "").trim();
          if (name.length > 0 && name.length < 40) {
            data.push({ name, tier: "Scholar", features: [cleanFeature(r[8]), cleanFeature(r[9]), cleanFeature(r[10]), cleanFeature(r[11])].filter(f => f.length > 0) });
          }
        }
      }
      return data;
    },
  },
  feats: {
    table: feats,
    csvFile: "ELDGROVE [CHARSHEET_BETA_v1.0] - FEATS AND MANEUVERS.csv",
    seeder: (rows) => {
      const data: any[] = [];
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i];
        if (r[1] && r[1].trim() !== "" && r[1].trim() !== "FEAT") {
          data.push({ name: r[1].trim(), effect: r[2] || null, featType: r[3] || null, prerequisites: r[4] || null });
        }
      }
      return data;
    },
  },
  maneuvers: {
    table: maneuvers,
    csvFile: "ELDGROVE [CHARSHEET_BETA_v1.0] - FEATS AND MANEUVERS.csv",
    seeder: (rows) => {
      const data: any[] = [];
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i];
        if (r[7] && r[7].trim() !== "" && r[7].trim() !== "MANEUVER") {
          data.push({ name: r[7].trim(), effect: r[8] || null, seeleCost: r[9] || null, prerequisite: r[10] || null });
        }
        if (r[11] && r[11].trim() !== "" && r[11].trim() !== "MANEUVER") {
          data.push({ name: r[11].trim(), effect: r[12] || null, seeleCost: r[13] || null, prerequisite: null });
        }
      }
      return data;
    },
  },
  languages: {
    table: languages,
    csvFile: "ELDGROVE [CHARSHEET_BETA_v1.0] - LANGUAGES.csv",
    seeder: (rows) => {
      const data: any[] = [];
      for (let i = 3; i < rows.length; i++) {
        const r = rows[i];
        if (!r[1] || r[1].trim() === "" || r[1].trim() === "Language") continue;
        data.push({ name: r[1].trim(), domain: r[2] || null, effect: r[3] || null, commands: r[4] || null, difficulty: safeInt(r[5]), tags: r[6] || null, damage: r[7] || null, counters: {} });
      }
      return data;
    },
  },
  leveling: {
    table: levelingTable,
    csvFile: "ELDGROVE [CHARSHEET_BETA_v1.0] - LEVELING TABLE.csv",
    seeder: (rows) => {
      const data: any[] = [];
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i];
        if (r[0] === undefined || r[0].trim() === "") continue;
        data.push({ level: r[0].trim(), bonuses: r[1] || null });
      }
      return data;
    },
  },
};

// Valid table names for external use
export const RESEEDABLE_TABLES = Object.keys(TABLE_MAP);

// Re-seed a single table from its CSV file on disk
export async function reseedTable(tableName: string): Promise<{ table: string; count: number }> {
  const entry = TABLE_MAP[tableName];
  if (!entry) throw new Error(`Unknown table: ${tableName}. Valid tables: ${RESEEDABLE_TABLES.join(", ")}`);

  const rows = readCSV(entry.csvFile);
  const data = entry.seeder(rows);

  await db.delete(entry.table);
  if (data.length > 0) await db.insert(entry.table).values(data);

  console.log(`Re-seeded ${data.length} rows into ${tableName}`);
  return { table: tableName, count: data.length };
}

// Re-seed a single table from raw CSV content (e.g. from an upload)
export async function reseedFromContent(tableName: string, csvContent: string): Promise<{ table: string; count: number }> {
  const entry = TABLE_MAP[tableName];
  if (!entry) throw new Error(`Unknown table: ${tableName}. Valid tables: ${RESEEDABLE_TABLES.join(", ")}`);

  // Also write the content to disk so the CSV file stays in sync
  const filePath = path.join(process.cwd(), "data", "csv", entry.csvFile);
  fs.writeFileSync(filePath, csvContent, "utf-8");

  const rows = splitCSVRows(csvContent).map(parseCSVLine);
  const data = entry.seeder(rows);

  await db.delete(entry.table);
  if (data.length > 0) await db.insert(entry.table).values(data);

  console.log(`Re-seeded ${data.length} rows into ${tableName} from uploaded content`);
  return { table: tableName, count: data.length };
}

// Re-seed ALL game data tables from CSV files on disk
export async function reseedAll(): Promise<{ results: { table: string; count: number }[] }> {
  const results: { table: string; count: number }[] = [];

  // Feats and maneuvers share a CSV, so handle them together
  const tableOrder = ["weapons", "armor", "items", "skills", "archetypes", "feats", "maneuvers", "languages", "leveling"];
  for (const tableName of tableOrder) {
    const result = await reseedTable(tableName);
    results.push(result);
  }

  console.log("Full re-seed complete!");
  return { results };
}

// Google Sheets tab name → database table name mapping
// Tab names match the user's existing Google Sheet (uppercase)
const SHEET_TAB_MAP: Record<string, string[]> = {
  "WEAPONS": ["weapons"],
  "ARMOR": ["armor"],
  "ITEMS": ["items"],
  "SKILLS": ["skills"],
  "ARCHETYPES": ["archetypes"],
  "FEATS AND MANEUVERS": ["feats", "maneuvers"],
  "LANGUAGES": ["languages"],
  "LEVELING TABLE": ["leveling"],
};

export const GOOGLE_SHEET_TABS = Object.keys(SHEET_TAB_MAP);

// Extract sheet identifier from various Google Sheets URL formats
function parseSheetInput(input: string): { type: "published" | "regular"; id: string } {
  // Published URL: https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv
  const pubMatch = input.match(/\/spreadsheets\/d\/e\/([^/]+)\//);
  if (pubMatch) return { type: "published", id: pubMatch[1] };

  // Regular URL: https://docs.google.com/spreadsheets/d/SHEET_ID/edit
  const regMatch = input.match(/\/spreadsheets\/d\/([^/]+)/);
  if (regMatch) return { type: "regular", id: regMatch[1] };

  // Bare ID
  return { type: input.startsWith("2PACX") ? "published" : "regular", id: input.trim() };
}

// Fetch a single tab from a Google Sheet as CSV text
async function fetchSheetTab(sheetInput: string, tabName: string): Promise<string> {
  const { type, id } = parseSheetInput(sheetInput);
  let url: string;

  if (type === "published") {
    // Published format: /d/e/KEY/pub?output=csv&sheet=TAB
    url = `https://docs.google.com/spreadsheets/d/e/${id}/pub?output=csv&sheet=${encodeURIComponent(tabName)}`;
  } else {
    // Regular format: /d/ID/gviz/tq?tqx=out:csv&sheet=TAB
    url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  }

  console.log(`  → ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch tab "${tabName}": HTTP ${response.status} ${response.statusText}`);
  }
  return await response.text();
}

// Sync ALL game data from a published Google Sheet
export async function syncFromGoogleSheet(sheetInput: string): Promise<{ results: { table: string; count: number }[] }> {
  const { type, id } = parseSheetInput(sheetInput);
  console.log(`Syncing from Google Sheet (${type}): ${id}`);
  const results: { table: string; count: number }[] = [];

  for (const [tabName, tableNames] of Object.entries(SHEET_TAB_MAP)) {
    try {
      console.log(`Fetching tab: ${tabName}...`);
      const csvContent = await fetchSheetTab(sheetInput, tabName);

      if (!csvContent || csvContent.length < 10) {
        console.warn(`Tab "${tabName}" returned empty or very short content, skipping.`);
        continue;
      }

      // Re-seed each table that maps to this tab
      for (const tableName of tableNames) {
        const result = await reseedFromContent(tableName, csvContent);
        results.push(result);
      }
    } catch (error: any) {
      console.error(`Error syncing tab "${tabName}":`, error.message);
      results.push({ table: tabName, count: -1 }); // -1 indicates failure
    }
  }

  console.log("Google Sheets sync complete!");
  return { results };
}

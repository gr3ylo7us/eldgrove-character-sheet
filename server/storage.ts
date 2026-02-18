import {
  characters, weapons, armor, items, skills, archetypes, feats, maneuvers, languages, levelingTable,
  type Character, type InsertCharacter, type Weapon, type Armor, type Item,
  type Skill, type Archetype, type Feat, type Maneuver, type Language, type LevelingEntry
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getCharacters(): Promise<Character[]>;
  getCharacter(id: number): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: number, character: Partial<InsertCharacter>): Promise<Character>;
  deleteCharacter(id: number): Promise<void>;
  getWeapons(): Promise<Weapon[]>;
  getArmor(): Promise<Armor[]>;
  getItems(): Promise<Item[]>;
  getSkills(): Promise<Skill[]>;
  getArchetypes(): Promise<Archetype[]>;
  getFeats(): Promise<Feat[]>;
  getManeuvers(): Promise<Maneuver[]>;
  getLanguages(): Promise<Language[]>;
  getLeveling(): Promise<LevelingEntry[]>;
}

export class DatabaseStorage implements IStorage {
  async getCharacters() { return db.select().from(characters); }
  async getCharacter(id: number) {
    const [c] = await db.select().from(characters).where(eq(characters.id, id));
    return c;
  }
  async createCharacter(data: InsertCharacter) {
    const [c] = await db.insert(characters).values(data).returning();
    return c;
  }
  async updateCharacter(id: number, data: Partial<InsertCharacter>) {
    const [c] = await db.update(characters).set(data).where(eq(characters.id, id)).returning();
    return c;
  }
  async deleteCharacter(id: number) {
    await db.delete(characters).where(eq(characters.id, id));
  }
  async getWeapons() {
    const validTypes = ['Melee Weapon', 'Blackpowder Weapon', 'Projectile Weapon', 'Explosive Weapon', 'Natural Weapon'];
    const all = await db.select().from(weapons);
    return all.filter(w => w.type && validTypes.includes(w.type));
  }
  async getArmor() { return db.select().from(armor); }
  async getItems() { return db.select().from(items); }
  async getSkills() { return db.select().from(skills); }
  async getArchetypes() { return db.select().from(archetypes); }
  async getFeats() { return db.select().from(feats); }
  async getManeuvers() { return db.select().from(maneuvers); }
  async getLanguages() { return db.select().from(languages); }
  async getLeveling() { return db.select().from(levelingTable); }
}

export const storage = new DatabaseStorage();

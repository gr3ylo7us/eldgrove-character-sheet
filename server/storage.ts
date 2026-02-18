import {
  characters, weapons, armor, items, skills, archetypes, feats, maneuvers, languages, levelingTable,
  type Character, type InsertCharacter, type Weapon, type Armor, type Item,
  type Skill, type Archetype, type Feat, type Maneuver, type Language, type LevelingEntry
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getCharactersByUser(userId: string): Promise<Character[]>;
  getCharacterForUser(id: number, userId: string): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacterForUser(id: number, userId: string, character: Partial<InsertCharacter>): Promise<Character | undefined>;
  deleteCharacterForUser(id: number, userId: string): Promise<void>;
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
  async getCharactersByUser(userId: string) {
    return db.select().from(characters).where(eq(characters.userId, userId));
  }
  async getCharacterForUser(id: number, userId: string) {
    const [c] = await db.select().from(characters).where(and(eq(characters.id, id), eq(characters.userId, userId)));
    return c;
  }
  async createCharacter(data: InsertCharacter) {
    const result = await db.insert(characters).values(data).returning();
    return result[0];
  }
  async updateCharacterForUser(id: number, userId: string, data: Partial<InsertCharacter>) {
    const result = await db.update(characters).set(data).where(and(eq(characters.id, id), eq(characters.userId, userId))).returning();
    return result[0];
  }
  async deleteCharacterForUser(id: number, userId: string) {
    await db.delete(characters).where(and(eq(characters.id, id), eq(characters.userId, userId)));
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

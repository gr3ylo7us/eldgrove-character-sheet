
import { characters, weapons, armor, items, skills, archetypes, feats, 
  type Character, type InsertCharacter, type Weapon, type Armor, type Item, type Skill, type Archetype, type Feat } from "@shared/schema";
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

  seedTable<T extends { id: number }>(table: any, data: any[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getCharacters(): Promise<Character[]> { return await db.select().from(characters); }
  async getCharacter(id: number): Promise<Character | undefined> {
    const [char] = await db.select().from(characters).where(eq(characters.id, id));
    return char;
  }
  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const [char] = await db.insert(characters).values(insertCharacter).returning();
    return char;
  }
  async updateCharacter(id: number, update: Partial<InsertCharacter>): Promise<Character> {
    const [char] = await db.update(characters).set(update).where(eq(characters.id, id)).returning();
    return char;
  }
  async deleteCharacter(id: number): Promise<void> { await db.delete(characters).where(eq(characters.id, id)); }

  async getWeapons(): Promise<Weapon[]> { return await db.select().from(weapons); }
  async getArmor(): Promise<Armor[]> { return await db.select().from(armor); }
  async getItems(): Promise<Item[]> { return await db.select().from(items); }
  async getSkills(): Promise<Skill[]> { return await db.select().from(skills); }
  async getArchetypes(): Promise<Archetype[]> { return await db.select().from(archetypes); }
  async getFeats(): Promise<Feat[]> { return await db.select().from(feats); }

  async seedTable(table: any, data: any[]): Promise<void> {
    if (data.length > 0) {
      await db.insert(table).values(data).onConflictDoNothing();
    }
  }
}

export const storage = new DatabaseStorage();

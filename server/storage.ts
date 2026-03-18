import {
  characters, weapons, armor, items, skills, archetypes, feats, maneuvers, languages, levelingTable, games, gameMembers,
  type Character, type InsertCharacter, type Weapon, type Armor, type Item,
  type Skill, type Archetype, type Feat, type Maneuver, type Language, type LevelingEntry,
  type Game, type InsertGame, type GameMember, type InsertGameMember
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
  
  // Games
  createGame(game: InsertGame): Promise<Game>;
  getGameByInviteCode(code: string): Promise<Game | undefined>;
  getGamesForUser(userId: string): Promise<{ game: Game; role: string }[]>;
  getGame(id: number): Promise<Game | undefined>;
  joinGame(member: InsertGameMember): Promise<GameMember>;
  getGameMembers(gameId: number): Promise<(GameMember & { character?: Character | null })[]>;
  updateGameMemberCharacter(gameId: number, userId: string, characterId: number | null): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getCharactersByUser(userId: string) {
    return db.select().from(characters).where(eq(characters.userId, userId));
  }
  async getCharacterForUser(id: number, userId: string) {
    const [c] = await db.select().from(characters).where(and(eq(characters.id, id), eq(characters.userId, userId)));
    if (c) return c;
    
    // Check if the user is a GM in a game this character is bound to
    const [char] = await db.select().from(characters).where(eq(characters.id, id));
    if (!char) return undefined;
    
    // Find all games this character is part of
    const memberships = await db.select().from(gameMembers).where(eq(gameMembers.characterId, id));
    for (const mem of memberships) {
      // Check if the current user is a GM of this game
      const [gmRecord] = await db.select()
        .from(gameMembers)
        .where(and(
          eq(gameMembers.gameId, mem.gameId),
          eq(gameMembers.userId, userId),
          eq(gameMembers.role, 'gm')
        ));
        
      if (gmRecord) {
        return char; // User is a GM, they have read access
      }
    }
    
    return undefined;
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

  // Games
  async createGame(data: InsertGame) {
    const result = await db.insert(games).values(data).returning();
    return result[0];
  }
  async getGameByInviteCode(code: string) {
    const [g] = await db.select().from(games).where(eq(games.inviteCode, code));
    return g;
  }
  async getGame(id: number) {
    const [g] = await db.select().from(games).where(eq(games.id, id));
    return g;
  }
  async getGamesForUser(userId: string) {
    const memberRecords = await db.select().from(gameMembers).where(eq(gameMembers.userId, userId));
    const result: { game: Game; role: string }[] = [];
    for (const mem of memberRecords) {
      const parentGame = await this.getGame(mem.gameId);
      if (parentGame) result.push({ game: parentGame, role: mem.role });
    }
    return result;
  }
  async joinGame(data: InsertGameMember) {
    const result = await db.insert(gameMembers).values(data).returning();
    return result[0];
  }
  async getGameMembers(gameId: number) {
    const members = await db.select().from(gameMembers).where(eq(gameMembers.gameId, gameId));
    // Fetch related characters manually for SQLite compatibility
    const withChars = [];
    for (const m of members) {
      let char = null;
      if (m.characterId) char = await this.getCharacterForUser(m.characterId, m.userId);
      withChars.push({ ...m, character: char });
    }
    return withChars;
  }
  async updateGameMemberCharacter(gameId: number, userId: string, characterId: number | null) {
    await db.update(gameMembers).set({ characterId }).where(and(eq(gameMembers.gameId, gameId), eq(gameMembers.userId, userId)));
  }
}

export const storage = new DatabaseStorage();


import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  race: text("race").default(""),
  class: text("class").default(""),
  level: integer("level").default(1),
  
  // Core Stats (flexible key-value storage for custom systems)
  stats: jsonb("stats").default({}), 
  // Derived stats/formulas can be computed on frontend or backend
  
  // Detailed data
  skills: jsonb("skills").default([]),
  equipment: jsonb("equipment").default([]),
  abilities: jsonb("abilities").default([]),
  
  // Metadata
  notes: text("notes").default(""),
  imageUrl: text("image_url"),
  isNpc: boolean("is_npc").default(false),
});

export const insertCharacterSchema = createInsertSchema(characters).omit({ id: true });

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;

// Flexible stat type for the JSONB column
export type Stat = {
  name: string;
  value: number;
  modifier?: number;
};

// API Types
export type CreateCharacterRequest = InsertCharacter;
export type UpdateCharacterRequest = Partial<InsertCharacter>;

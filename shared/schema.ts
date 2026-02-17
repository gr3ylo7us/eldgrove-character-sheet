
import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  race: text("race").default(""),
  class: text("class").default(""),
  level: integer("level").default(1),
  stats: jsonb("stats").default({}),
  skills: jsonb("skills").default([]),
  equipment: jsonb("equipment").default([]),
  abilities: jsonb("abilities").default([]),
  notes: text("notes").default(""),
  imageUrl: text("image_url"),
  isNpc: boolean("is_npc").default(false),
});

export const weapons = pgTable("weapons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type"),
  dice: text("dice"),
  mastery: text("mastery"),
  normalDamage: text("normal_damage"),
  critDamage: text("crit_damage"),
  attacks: text("attacks"),
  damageType: text("damage_type"),
  effects: text("effects"),
  upgradeEffects: text("upgrade_effects"),
  occupiedSlot: text("occupied_slot"),
  keyword: text("keyword"),
  effect: text("effect"),
});

export const armor = pgTable("armor", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  protection: text("protection"),
  evasionDice: text("evasion_dice"),
  effects: text("effects"),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rarity: text("rarity"),
  bonuses: text("bonuses"),
  description: text("description"),
  effects: text("effects"),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  stat: text("stat"),
  category: text("category"),
  spiritStat: text("spirit_stat"),
  overview: text("overview"),
});

export const archetypes = pgTable("archetypes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  feature1: text("feature1"),
  feature2: text("feature2"),
  feature3: text("feature3"),
  feature4: text("feature4"),
});

export const feats = pgTable("feats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  effect: text("effect"),
  type: text("type"),
  prerequisites: text("prerequisites"),
});

export const insertCharacterSchema = createInsertSchema(characters).omit({ id: true });
export const insertWeaponSchema = createInsertSchema(weapons).omit({ id: true });
export const insertArmorSchema = createInsertSchema(armor).omit({ id: true });
export const insertItemSchema = createInsertSchema(items).omit({ id: true });
export const insertSkillSchema = createInsertSchema(skills).omit({ id: true });
export const insertArchetypeSchema = createInsertSchema(archetypes).omit({ id: true });
export const insertFeatSchema = createInsertSchema(feats).omit({ id: true });

export type Character = typeof characters.$inferSelect;
export type Weapon = typeof weapons.$inferSelect;
export type Armor = typeof armor.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Archetype = typeof archetypes.$inferSelect;
export type Feat = typeof feats.$inferSelect;

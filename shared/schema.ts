import { pgTable, text, serial, integer, boolean, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  name: text("name").notNull(),
  race: text("race").default(""),
  archetype: text("archetype").default(""),
  level: integer("level").default(1),
  progress: integer("progress").default(0),

  power: integer("power").default(1),
  finesse: integer("finesse").default(1),
  vitality: integer("vitality").default(1),
  acumen: integer("acumen").default(1),
  diplomacy: integer("diplomacy").default(1),
  intuition: integer("intuition").default(1),
  talent: integer("talent").default(0),
  moxie: integer("moxie").default(1),
  audacity: integer("audacity").default(1),

  seeleMax: integer("seele_max").default(9),
  seeleCurrent: integer("seele_current").default(9),
  renown: integer("renown").default(0),
  karma: integer("karma").default(0),
  woundsCurrent: integer("wounds_current").default(0),
  skulkMax: integer("skulk_max").default(0),
  skulkCurrent: integer("skulk_current").default(0),

  armorName: text("armor_name").default(""),
  armorProtection: integer("armor_protection").default(0),
  armorEvasionDice: integer("armor_evasion_dice").default(1),
  armorEffects: text("armor_effects").default(""),

  skillTiers: jsonb("skill_tiers").default({}),
  equippedWeapons: jsonb("equipped_weapons").default([]),
  knownLanguages: jsonb("known_languages").default([]),
  knownFeats: jsonb("known_feats").default([]),
  knownManeuvers: jsonb("known_maneuvers").default([]),
  inventory: jsonb("inventory").default([]),
  archetypeFeatures: jsonb("archetype_features").default([]),
  selectedArchetypes: jsonb("selected_archetypes").default([]),
  notes: text("notes").default(""),
});

export const weapons = pgTable("weapons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type"),
  dice: integer("dice").default(0),
  mastery: text("mastery"),
  normalDamage: integer("normal_damage").default(0),
  critDamage: integer("crit_damage").default(0),
  attacks: integer("attacks").default(0),
  damageType: text("damage_type"),
  effects: text("effects"),
  upgradeEffects: text("upgrade_effects"),
  occupiedSlot: text("occupied_slot"),
  keyword: text("keyword"),
  keywordEffect: text("keyword_effect"),
});

export const armor = pgTable("armor", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  protection: integer("protection").default(0),
  evasionDice: integer("evasion_dice").default(1),
  effects: text("effects"),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rarity: integer("rarity").default(0),
  bonuses: text("bonuses"),
  category: text("category").default("general"),
  description: text("description"),
  effects: text("effects"),
  usageDice: text("usage_dice"),
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
  tier: text("tier"),
  features: jsonb("features").default([]),
});

export const feats = pgTable("feats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  effect: text("effect"),
  featType: text("feat_type"),
  prerequisites: text("prerequisites"),
});

export const maneuvers = pgTable("maneuvers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  effect: text("effect"),
  seeleCost: text("seele_cost"),
  prerequisite: text("prerequisite"),
});

export const languages = pgTable("languages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain"),
  effect: text("effect"),
  commands: text("commands"),
  difficulty: integer("difficulty").default(3),
  tags: text("tags"),
  damage: text("damage"),
  counters: jsonb("counters").default({}),
});

export const levelingTable = pgTable("leveling_table", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(),
  bonuses: text("bonuses"),
});

export const insertCharacterSchema = createInsertSchema(characters).omit({ id: true });
export const insertWeaponSchema = createInsertSchema(weapons).omit({ id: true });
export const insertArmorSchema = createInsertSchema(armor).omit({ id: true });
export const insertItemSchema = createInsertSchema(items).omit({ id: true });
export const insertSkillSchema = createInsertSchema(skills).omit({ id: true });
export const insertArchetypeSchema = createInsertSchema(archetypes).omit({ id: true });
export const insertFeatSchema = createInsertSchema(feats).omit({ id: true });
export const insertManeuverSchema = createInsertSchema(maneuvers).omit({ id: true });
export const insertLanguageSchema = createInsertSchema(languages).omit({ id: true });
export const insertLevelingSchema = createInsertSchema(levelingTable).omit({ id: true });

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Weapon = typeof weapons.$inferSelect;
export type Armor = typeof armor.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Archetype = typeof archetypes.$inferSelect;
export type Feat = typeof feats.$inferSelect;
export type Maneuver = typeof maneuvers.$inferSelect;
export type Language = typeof languages.$inferSelect;
export type LevelingEntry = typeof levelingTable.$inferSelect;

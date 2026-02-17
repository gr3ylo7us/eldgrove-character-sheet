import { useQuery } from "@tanstack/react-query";
import type { Weapon, Armor, Item, Skill, Archetype, Feat, Maneuver, Language, LevelingEntry } from "@shared/schema";

export function useWeapons() { return useQuery<Weapon[]>({ queryKey: ["/api/data/weapons"] }); }
export function useArmor() { return useQuery<Armor[]>({ queryKey: ["/api/data/armor"] }); }
export function useItems() { return useQuery<Item[]>({ queryKey: ["/api/data/items"] }); }
export function useSkills() { return useQuery<Skill[]>({ queryKey: ["/api/data/skills"] }); }
export function useArchetypes() { return useQuery<Archetype[]>({ queryKey: ["/api/data/archetypes"] }); }
export function useFeats() { return useQuery<Feat[]>({ queryKey: ["/api/data/feats"] }); }
export function useManeuvers() { return useQuery<Maneuver[]>({ queryKey: ["/api/data/maneuvers"] }); }
export function useLanguages() { return useQuery<Language[]>({ queryKey: ["/api/data/languages"] }); }
export function useLeveling() { return useQuery<LevelingEntry[]>({ queryKey: ["/api/data/leveling"] }); }

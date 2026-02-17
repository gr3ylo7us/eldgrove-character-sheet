import type { Character } from "@shared/schema";

export function getReflexes(c: Character): number {
  return (c.finesse ?? 1) + (c.acumen ?? 1);
}

export function getSeek(c: Character): number {
  return (c.acumen ?? 1) + (c.intuition ?? 1) + 1;
}

export function getNerve(c: Character): number {
  return (c.vitality ?? 1) + (c.diplomacy ?? 1) + (c.power ?? 1);
}

export function getHealth(c: Character): number {
  return (c.vitality ?? 1) + (c.power ?? 1);
}

export function getWill(c: Character): number {
  return (c.diplomacy ?? 1);
}

export function getAptitude(c: Character): number {
  return (c.acumen ?? 1);
}

export function getMove(c: Character): number {
  return (c.finesse ?? 1);
}

export function getEvade(c: Character): number {
  const reflexes = getReflexes(c);
  return Math.floor(reflexes / 2) + (c.armorEvasionDice ?? 0);
}

export function getSkulk(c: Character): number {
  const reflexes = getReflexes(c);
  const skillTiers = (c.skillTiers as Record<string, number>) || {};
  return reflexes + (skillTiers["Skullduggery"] || 0);
}

export function getSeeleMax(c: Character): number {
  return (c.vitality ?? 1) + (c.diplomacy ?? 1) + (c.intuition ?? 1) + (c.acumen ?? 1);
}

export function getWeaponAttack(c: Character, weapon: any): number {
  const skillTiers = (c.skillTiers as Record<string, number>) || {};
  let mastery = 0;
  if (weapon.mastery === "Melee Mastery") mastery = skillTiers["Melee Mastery"] || 0;
  else if (weapon.mastery === "Ranged Mastery") mastery = skillTiers["Ranged Mastery"] || 0;
  else if (weapon.mastery === "Both") mastery = Math.max(skillTiers["Melee Mastery"] || 0, skillTiers["Ranged Mastery"] || 0);
  return (weapon.dice || 0) + mastery + (weapon.attacks || 0);
}

export function getSpellCast(c: Character, lang: any): number {
  const skillTiers = (c.skillTiers as Record<string, number>) || {};
  const arcane = skillTiers["Arcane Mastery"] || 0;
  return arcane + (lang.difficulty || 3);
}

export function getWoundscaleThreshold(wounds: number): string {
  if (wounds <= 0) return "Uninjured";
  if (wounds <= 5) return "Superficial";
  if (wounds <= 10) return "Light";
  if (wounds <= 15) return "Moderate";
  if (wounds <= 20) return "Severe";
  if (wounds <= 25) return "Critical";
  if (wounds <= 28) return "Mortal";
  return "Death's Door";
}

export const STAT_LABELS: Record<string, string> = {
  power: "POW",
  finesse: "FIN",
  vitality: "VIT",
  acumen: "ACU",
  diplomacy: "DIP",
  intuition: "INT",
};

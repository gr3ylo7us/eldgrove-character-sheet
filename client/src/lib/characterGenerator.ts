import type { InsertCharacter, Weapon, Armor, Skill, Archetype, Feat, Maneuver, Language } from "@shared/schema";

export type CombatStyle = "melee" | "ranged" | "magic";
export type RoleType = "dps" | "tank" | "support" | "rogue";
export interface CharacterRole {
  combatStyle: CombatStyle;
  roleType: RoleType;
}

export const COMBAT_STYLES: { value: CombatStyle; label: string }[] = [
  { value: "melee", label: "Melee" },
  { value: "ranged", label: "Ranged" },
  { value: "magic", label: "Magic" },
];

export const ROLE_TYPES: { value: RoleType; label: string }[] = [
  { value: "dps", label: "DPS" },
  { value: "tank", label: "Tank" },
  { value: "support", label: "Support" },
  { value: "rogue", label: "Rogue" },
];

const BODY_STATS = ["power", "finesse", "vitality"] as const;
const MIND_STATS = ["acumen", "diplomacy", "intuition"] as const;
const SPIRIT_STATS = ["talent", "moxie", "audacity"] as const;

interface StatWeights {
  power: number; finesse: number; vitality: number;
  acumen: number; diplomacy: number; intuition: number;
  talent: number; moxie: number; audacity: number;
}

function getStatWeights(role: CharacterRole): StatWeights {
  const base: StatWeights = { power: 1, finesse: 1, vitality: 1, acumen: 1, diplomacy: 1, intuition: 1, talent: 1, moxie: 1, audacity: 1 };

  if (role.combatStyle === "melee") {
    base.power += 3; base.finesse += 2; base.vitality += 2;
  } else if (role.combatStyle === "ranged") {
    base.finesse += 3; base.acumen += 2; base.intuition += 1;
  } else {
    base.acumen += 2; base.intuition += 2; base.diplomacy += 1; base.talent += 2;
  }

  if (role.roleType === "dps") {
    if (role.combatStyle === "melee") base.power += 2;
    else if (role.combatStyle === "ranged") base.finesse += 2;
    else base.acumen += 2;
  } else if (role.roleType === "tank") {
    base.vitality += 3; base.power += 2; base.finesse += 1;
  } else if (role.roleType === "support") {
    base.diplomacy += 3; base.acumen += 1; base.intuition += 1;
  } else {
    base.finesse += 3; base.intuition += 2; base.acumen += 1;
  }

  return base;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function distributePoints(totalPoints: number, weights: number[]): number[] {
  const result = new Array(weights.length).fill(0);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  for (let i = 0; i < totalPoints; i++) {
    let r = Math.random() * totalWeight;
    for (let j = 0; j < weights.length; j++) {
      r -= weights[j];
      if (r <= 0) {
        result[j]++;
        break;
      }
    }
  }
  return result;
}

interface RoleArchetypeMap {
  initiate: string[];
  acolyte: string[];
  scholar: string[];
}

function getArchetypePreferences(role: CharacterRole): RoleArchetypeMap {
  const { combatStyle, roleType } = role;

  const initiateMap: Record<string, Record<string, string[]>> = {
    melee:  { dps: ["Warrior"], tank: ["Warrior", "Priest"], support: ["Priest"], rogue: ["Rogue", "Warrior"] },
    ranged: { dps: ["Warrior", "Rogue"], tank: ["Warrior"], support: ["Priest"], rogue: ["Rogue"] },
    magic:  { dps: ["Mage"], tank: ["Priest", "Mage"], support: ["Priest", "Mage"], rogue: ["Mage", "Rogue"] },
  };

  const acolyteMap: Record<string, Record<string, string[]>> = {
    melee:  { dps: ["Fighter", "Berserker"], tank: ["Fighter", "Cleric"], support: ["Cleric", "Oracle"], rogue: ["Thief", "Assassin"] },
    ranged: { dps: ["Fighter"], tank: ["Fighter", "Cleric"], support: ["Cleric", "Oracle"], rogue: ["Thief", "Assassin"] },
    magic:  { dps: ["Sorcerer", "Wizard"], tank: ["Cleric", "Oracle"], support: ["Cleric", "Oracle", "Wizard"], rogue: ["Wizard", "Sorcerer"] },
  };

  const scholarMap: Record<string, Record<string, string[]>> = {
    melee:  { dps: ["Spellbinder", "Paladin"], tank: ["Paladin"], support: ["Bard", "Paladin"], rogue: ["Occultist", "Ranger"] },
    ranged: { dps: ["Gunner", "Ranger"], tank: ["Ranger", "Paladin"], support: ["Bard", "Artificer"], rogue: ["Ranger", "Occultist"] },
    magic:  { dps: ["Mystic", "Druid"], tank: ["Druid", "Paladin"], support: ["Bard", "Druid", "Artificer"], rogue: ["Occultist", "Mystic"] },
  };

  return {
    initiate: initiateMap[combatStyle]?.[roleType] || ["Warrior"],
    acolyte: acolyteMap[combatStyle]?.[roleType] || ["Fighter"],
    scholar: scholarMap[combatStyle]?.[roleType] || ["Ranger"],
  };
}

function getWeaponPreferences(role: CharacterRole): string[] {
  if (role.combatStyle === "ranged") return ["Projectile Weapon", "Blackpowder Weapon"];
  if (role.combatStyle === "melee") return ["Melee Weapon"];
  return ["Melee Weapon", "Natural Weapon"];
}

function getSkillPreferences(role: CharacterRole): string[] {
  const base: string[] = [];
  const { combatStyle, roleType } = role;

  if (combatStyle === "melee") base.push("Melee Mastery", "Athleticism", "Pain Tolerance", "Endurance", "Edge", "Footwork");
  else if (combatStyle === "ranged") base.push("Ranged Mastery", "Hypersense", "Composure", "Reaction Speed", "Edge");
  else base.push("Arcane Mastery", "Sixth Sense", "Interfacing", "Instinct");

  if (roleType === "dps") base.push("Edge", "Reaction Speed", "Instinct");
  else if (roleType === "tank") base.push("Endurance", "Pain Tolerance", "Homeostasis", "Athleticism");
  else if (roleType === "support") base.push("Medicine", "Theology", "Insight", "Orate", "Social Engineering");
  else base.push("Savoir Faire", "Acrobatics", "Contortion", "Skullduggery", "Legerdemain", "Composure", "Bluff");

  return Array.from(new Set(base));
}

function getLanguagePreferences(role: CharacterRole, allLanguages: Language[]): string[] {
  const { combatStyle, roleType } = role;
  const prefs: string[] = [];

  if (roleType === "dps") {
    prefs.push("Strela", "Ugal", "Pamet");
  } else if (roleType === "tank") {
    prefs.push("Zemila", "Neora", "Telos");
  } else if (roleType === "support") {
    prefs.push("Telos", "Belog", "Vietar", "Neora");
  } else {
    prefs.push("Marak", "Pamet", "Belog");
  }

  if (combatStyle === "magic") {
    prefs.push("Aard", "Strela", "Ugal");
  }

  return Array.from(new Set(prefs));
}

export interface LevelRewards {
  level: number;
  bodyMindStatPoints: number;
  spiritStatPoints: number;
  skillFeats: number;
  feats: number;
  maneuvers: number;
  skillOpenings: number;
  archetypeTier: "initiate" | "acolyte" | "scholar" | null;
  archetypeFeatureCount: number;
  combatMastery: number;
}

export function getLevelRewards(level: number): LevelRewards[] {
  const rewards: LevelRewards[] = [];

  rewards.push({
    level: 0,
    bodyMindStatPoints: 3,
    spiritStatPoints: 1,
    skillFeats: 2,
    feats: 1,
    maneuvers: 2,
    skillOpenings: 0,
    archetypeTier: null,
    archetypeFeatureCount: 0,
    combatMastery: 0,
  });

  if (level >= 1) {
    rewards.push({
      level: 1,
      bodyMindStatPoints: 6,
      spiritStatPoints: 0,
      skillFeats: 0,
      feats: 0,
      maneuvers: 0,
      skillOpenings: 0,
      archetypeTier: "initiate",
      archetypeFeatureCount: 2,
      combatMastery: 0,
    });
  }

  for (let l = 2; l <= Math.min(level, 4); l++) {
    rewards.push({
      level: l,
      bodyMindStatPoints: 1,
      spiritStatPoints: 0,
      skillFeats: l === 2 ? 2 : 0,
      feats: 0,
      maneuvers: 0,
      skillOpenings: 1,
      archetypeTier: "acolyte",
      archetypeFeatureCount: 1,
      combatMastery: 0,
    });
  }

  for (let l = 5; l <= level; l++) {
    rewards.push({
      level: l,
      bodyMindStatPoints: 1,
      spiritStatPoints: 0,
      skillFeats: (l === 5 || l % 2 === 1) ? 2 : 0,
      feats: 0,
      maneuvers: 0,
      skillOpenings: 1,
      archetypeTier: "scholar",
      archetypeFeatureCount: 1,
      combatMastery: l === 6 ? 1 : 0,
    });
  }

  return rewards;
}

export interface GameData {
  weapons: Weapon[];
  armor: Armor[];
  skills: Skill[];
  archetypes: Archetype[];
  feats: Feat[];
  maneuvers: Maneuver[];
  languages: Language[];
}

export function generateRandomCharacter(
  name: string,
  race: string,
  level: number,
  role: CharacterRole,
  gameData: GameData,
): InsertCharacter {
  const weights = getStatWeights(role);
  const archPrefs = getArchetypePreferences(role);
  const weaponTypes = getWeaponPreferences(role);
  const skillPrefs = getSkillPreferences(role);
  const langPrefs = getLanguagePreferences(role, gameData.languages);

  const allRewards = getLevelRewards(level);

  let totalBodyMindPoints = 0;
  let totalSpiritPoints = 0;
  let totalSkillFeats = 0;
  let totalFeats = 0;
  let totalManeuvers = 0;
  let totalSkillOpenings = 0;
  let totalCombatMastery = 0;

  for (const r of allRewards) {
    totalBodyMindPoints += r.bodyMindStatPoints;
    totalSpiritPoints += r.spiritStatPoints;
    totalSkillFeats += r.skillFeats;
    totalFeats += r.feats;
    totalManeuvers += r.maneuvers;
    totalSkillOpenings += r.skillOpenings;
    totalCombatMastery += r.combatMastery;
  }

  const bodyMindWeights = [weights.power, weights.finesse, weights.vitality, weights.acumen, weights.diplomacy, weights.intuition];
  const bodyMindDist = distributePoints(totalBodyMindPoints, bodyMindWeights);
  const spiritWeights = [weights.talent, weights.moxie, weights.audacity];
  const spiritDist = distributePoints(totalSpiritPoints, spiritWeights);

  const stats = {
    power: 1 + bodyMindDist[0],
    finesse: 1 + bodyMindDist[1],
    vitality: 1 + bodyMindDist[2],
    acumen: 1 + bodyMindDist[3],
    diplomacy: 1 + bodyMindDist[4],
    intuition: 1 + bodyMindDist[5],
    talent: 0 + spiritDist[0],
    moxie: 1 + spiritDist[1],
    audacity: 1 + spiritDist[2],
  };

  const selectedArchetypes: any[] = [];
  const archetypeFeatures: string[] = [];

  const needsInitiate = allRewards.some(r => r.archetypeTier === "initiate");
  const needsAcolyte = allRewards.some(r => r.archetypeTier === "acolyte");
  const needsScholar = allRewards.some(r => r.archetypeTier === "scholar");

  if (needsInitiate) {
    const initName = pick(archPrefs.initiate);
    const initArch = gameData.archetypes.find(a => a.name === initName && a.tier === "Initiate");
    if (initArch) {
      const features = (initArch.features as string[]) || [];
      selectedArchetypes.push({ name: initArch.name, tier: "Initiate", selectedFeatures: features.slice(0, 2) });
      archetypeFeatures.push(...features.slice(0, 2));
    }
  }

  if (needsAcolyte) {
    const acoName = pick(archPrefs.acolyte);
    const acoArch = gameData.archetypes.find(a => a.name === acoName && a.tier === "Acolyte");
    if (acoArch) {
      const features = (acoArch.features as string[]) || [];
      const acoLevels = allRewards.filter(r => r.archetypeTier === "acolyte");
      const featureCount = Math.min(acoLevels.length, features.length);
      selectedArchetypes.push({ name: acoArch.name, tier: "Acolyte", selectedFeatures: features.slice(0, featureCount) });
      archetypeFeatures.push(...features.slice(0, featureCount));
    }
  }

  if (needsScholar) {
    const schName = pick(archPrefs.scholar);
    const schArch = gameData.archetypes.find(a => a.name === schName && a.tier === "Scholar");
    if (schArch) {
      const features = (schArch.features as string[]) || [];
      const schLevels = allRewards.filter(r => r.archetypeTier === "scholar");
      const featureCount = Math.min(schLevels.length, features.length);
      selectedArchetypes.push({ name: schArch.name, tier: "Scholar", selectedFeatures: features.slice(0, featureCount) });
      archetypeFeatures.push(...features.slice(0, featureCount));
    }
  }

  const validWeapons = gameData.weapons.filter(w =>
    w.type && weaponTypes.includes(w.type) && w.mastery && w.dice && w.dice > 0
  );
  const mainWeapon = validWeapons.length > 0 ? pick(validWeapons) : null;
  const offhandOptions = validWeapons.filter(w => w.effects?.includes("Off-hand") && w.name !== mainWeapon?.name);
  const offhand = offhandOptions.length > 0 && Math.random() > 0.5 ? pick(offhandOptions) : null;

  const equippedWeapons: any[] = [];
  if (mainWeapon) {
    equippedWeapons.push({
      name: mainWeapon.name, type: mainWeapon.type, dice: mainWeapon.dice,
      mastery: mainWeapon.mastery, normalDamage: mainWeapon.normalDamage,
      critDamage: mainWeapon.critDamage, damageType: mainWeapon.damageType,
      effects: mainWeapon.effects, attacks: mainWeapon.attacks ?? 0,
    });
  }
  if (offhand) {
    equippedWeapons.push({
      name: offhand.name, type: offhand.type, dice: offhand.dice,
      mastery: offhand.mastery, normalDamage: offhand.normalDamage,
      critDamage: offhand.critDamage, damageType: offhand.damageType,
      effects: offhand.effects, attacks: offhand.attacks ?? 0,
    });
  }

  const skillTiers: Record<string, number> = {};
  const prioritizedSkills = [...skillPrefs];

  const masterySkill = role.combatStyle === "melee" ? "Melee Mastery" :
    role.combatStyle === "ranged" ? "Ranged Mastery" : "Arcane Mastery";
  if (!prioritizedSkills.includes(masterySkill)) prioritizedSkills.unshift(masterySkill);

  const totalSkillSlots = totalSkillOpenings + totalSkillFeats + totalCombatMastery;
  const openCount = Math.min(totalSkillSlots, prioritizedSkills.length);
  for (let i = 0; i < openCount; i++) {
    skillTiers[prioritizedSkills[i]] = Math.min(3, 1 + Math.floor(Math.random() * 2));
  }
  if (skillTiers[masterySkill]) {
    skillTiers[masterySkill] = Math.min(5, skillTiers[masterySkill] + totalCombatMastery + 1);
  }

  const knownLanguages: string[] = [];
  if (role.combatStyle === "magic" || role.roleType === "support") {
    const langCount = role.combatStyle === "magic" ? Math.min(4, 2 + Math.floor(level / 2)) : Math.min(2, 1 + Math.floor(level / 3));
    const preferred = langPrefs.filter(n => gameData.languages.some(l => l.name === n));
    knownLanguages.push(...pickN(preferred, langCount));
  }

  const availableFeats = gameData.feats.filter(f =>
    !f.name.startsWith("COMBAT SKILL FEAT:") && !f.name.startsWith("ROLEPLAY SKILL FEAT:") && !f.name.startsWith("Martial Art:")
  );
  const knownFeats = pickN(availableFeats, Math.max(1, totalFeats)).map(f => f.name);

  const skillFeatOptions = gameData.feats.filter(f => {
    if (!f.name.startsWith("COMBAT SKILL FEAT:")) return false;
    const skillName = f.name.replace("COMBAT SKILL FEAT: ", "").trim();
    return Object.keys(skillTiers).includes(skillName);
  });
  if (skillFeatOptions.length > 0 && totalSkillFeats > 0) {
    knownFeats.push(...pickN(skillFeatOptions, Math.min(totalSkillFeats, skillFeatOptions.length)).map(f => f.name));
  }

  const knownManeuvers = pickN(gameData.maneuvers, Math.max(2, totalManeuvers)).map(m => m.name);

  const armorTier = role.roleType === "tank" ? "heavy" : role.roleType === "rogue" ? "light" : "medium";
  let armorOptions: Armor[];
  if (armorTier === "heavy") {
    armorOptions = gameData.armor.filter(a => a.name.includes("Plate")).sort((a, b) => (b.protection ?? 0) - (a.protection ?? 0));
  } else if (armorTier === "light") {
    armorOptions = gameData.armor.filter(a => a.name.includes("Clothes") || a.name.includes("Leathers")).sort((a, b) => (b.evasionDice ?? 0) - (a.evasionDice ?? 0));
  } else {
    armorOptions = gameData.armor.filter(a => a.name.includes("Leathers")).sort((a, b) => ((b.protection ?? 0) + (b.evasionDice ?? 0)) - ((a.protection ?? 0) + (a.evasionDice ?? 0)));
  }

  const tierIndex = Math.min(Math.floor(level / 2), armorOptions.length - 1);
  const chosenArmor = armorOptions[Math.max(0, tierIndex)] || armorOptions[0] || { name: "Threadbare Clothes", protection: 0, evasionDice: 1, effects: "" };

  const bodySum = stats.power + stats.finesse + stats.vitality;
  const mindSum = stats.acumen + stats.diplomacy + stats.intuition;
  const spiritSum = stats.talent + stats.moxie + stats.audacity;
  const seeleMax = Math.ceil((bodySum + mindSum + spiritSum) / 2);

  return {
    name,
    race,
    archetype: selectedArchetypes[0]?.name || "",
    level,
    progress: 0,
    ...stats,
    seeleMax,
    seeleCurrent: seeleMax,
    renown: 0,
    karma: 0,
    woundsCurrent: 0,
    skulkMax: 0,
    skulkCurrent: 0,
    armorName: chosenArmor.name,
    armorProtection: chosenArmor.protection ?? 0,
    armorEvasionDice: chosenArmor.evasionDice ?? 1,
    armorEffects: chosenArmor.effects || "",
    skillTiers,
    equippedWeapons,
    knownLanguages,
    knownFeats,
    knownManeuvers,
    inventory: [],
    archetypeFeatures,
    selectedArchetypes,
    notes: `Generated as ${role.combatStyle} ${role.roleType}`,
  };
}

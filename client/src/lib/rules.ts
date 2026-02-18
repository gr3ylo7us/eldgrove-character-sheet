export interface RuleEntry {
  title: string;
  formula?: string;
  description: string;
  usage?: string;
  category?: string;
}

export const RULES: Record<string, RuleEntry> = {
  power: {
    title: "Power (POW)",
    category: "Body Stat",
    description: "How physically capable your character is. Largely influences damage dealt with melee weaponry.",
    usage: "Determines melee damage, contributes to Reflexes, Health, and Nerve.",
  },
  finesse: {
    title: "Finesse (FIN)",
    category: "Body Stat",
    description: "How nimble and dextrous your character is. Largely influences damage dealt with ranged weaponry.",
    usage: "Determines Move speed, contributes to Reflexes and Evade.",
  },
  vitality: {
    title: "Vitality (VIT)",
    category: "Body Stat",
    description: "How resilient your mortal instrument is.",
    usage: "Contributes to Health, Nerve, and Reflexes.",
  },
  acumen: {
    title: "Acumen (ACU)",
    category: "Mind Stat",
    description: "How well your character can deduce and reason with logic.",
    usage: "Determines Aptitude, contributes to Seek.",
  },
  diplomacy: {
    title: "Diplomacy (DIP)",
    category: "Mind Stat",
    description: "How socially intelligent your character is.",
    usage: "Determines Will, contributes to Nerve and Seek.",
  },
  intuition: {
    title: "Intuition (INT)",
    category: "Mind Stat",
    description: "How well your character can know things based on experience and instinct.",
    usage: "Contributes to Seek.",
  },
  talent: {
    title: "Talent (TAL)",
    category: "Spirit Stat",
    description: "How gifted or lucky your character is. Pips in Talent act as points that can be spent to reroll dice used for a skill check.",
    usage: "Spend pips to reroll dice in any skill check. Spent pips recover after a Rest.",
  },
  moxie: {
    title: "Moxie (MOX)",
    category: "Spirit Stat",
    description: "How much grit your character has. Modifies Body stat rolls (POW/FIN/VIT).",
    usage: "Spend pips to reduce the success threshold of Body rolls by 5. Spent pips recover after a Rest.",
  },
  audacity: {
    title: "Audacity (AUD)",
    category: "Spirit Stat",
    description: "How daring your character is. Modifies Mind stat rolls (ACU/DIP/INT).",
    usage: "Spend pips to reduce the success threshold of Mind rolls by 5. Spent pips recover after a Rest.",
  },

  reflexes: {
    title: "Reflexes (REF)",
    category: "Secondary Stat",
    formula: "max(POW, FIN, VIT) + ceil(avg(POW, FIN, VIT))",
    description: "How quickly your character responds to danger.",
    usage: "Called when evading traps or hazards you were not aware of. Also the base for Evade and Skulk calculations.",
  },
  seek: {
    title: "Seek",
    category: "Secondary Stat",
    formula: "max(ACU, DIP, INT) + ceil(avg(ACU, DIP, INT))",
    description: "How perceptive your character is.",
    usage: "Called whenever you need to find hidden objects, notice details, or shred an enemy's Skulk value.",
  },
  seele: {
    title: "Seele",
    category: "Resource",
    formula: "ceil((POW + FIN + VIT + ACU + DIP + INT + TAL + MOX + AUD) / 2)",
    description: "Your character's spiritual resources. The ubiquitous resource all characters use to execute maneuvers, cast magic, or activate abilities and items.",
    usage: "Spent to cast spells (Languages), activate Maneuvers, use Evasive Maneuver, and power special abilities. Recovers after Rest.",
  },
  nerve: {
    title: "Nerve",
    category: "Secondary Stat",
    formula: "ACU + FIN + INT",
    description: "Your character's composure and ability to endure stress.",
    usage: "Determines resistance to fear, intimidation, and stressful situations.",
  },
  will: {
    title: "Will",
    category: "Secondary Stat",
    formula: "VIT + DIP + POW",
    description: "Your character's mental fortitude and resilience.",
    usage: "Determines resistance to charm, compulsion, and mental effects.",
  },
  move: {
    title: "Move",
    category: "Secondary Stat",
    formula: "FIN",
    description: "How far your character can move in a turn, measured in inches on the tabletop.",
    usage: "Advance your character a distance in inches equal to your Move. Dash = Move/2. Charge = Move + Move/2.",
  },
  evade: {
    title: "Evade",
    category: "Combat Stat",
    formula: "floor(Reflexes / 2) + Armor Evasion Dice",
    description: "The number of dice rolled to avoid incoming attacks.",
    usage: "When attacked, roll d20s equal to your Evade. Successes over the hit threshold negate damage. When Defending, you may spend Seele to decrease the success threshold.",
  },
  skulk: {
    title: "Skulk",
    category: "Resource",
    formula: "Roll pool: Reflexes + Skullduggery skill tier",
    description: "Your stealth health. Roll your Skulk pool to establish how stealthy you are - net successes become your Skulk HP.",
    usage: "Skulk HP depletes as you make noise or are spotted. Weapons/spells with the Silent property let you spend Skulk to add bonus sneak attack dice. Enemy Seek can shred this value.",
  },
  woundscale: {
    title: "Woundscale",
    category: "Resource",
    description: "Tracks damage taken. Progresses through stages: Uninjured (0) \u2192 Superficial (1-5) \u2192 Light (6-10) \u2192 Moderate (11-15) \u2192 Severe (16-20) \u2192 Critical (21-25) \u2192 Mortal (26-28) \u2192 Death's Door (29-30).",
    usage: "As wounds accumulate, your character suffers increasing penalties. At Death's Door, your character is at risk of death.",
  },

  weaponAttack: {
    title: "Weapon Attack (ATK)",
    category: "Combat",
    formula: "Weapon Dice + Mastery Skill Tier",
    description: "The number of d20s rolled when attacking with this weapon. Uses Melee Mastery for melee weapons, Ranged Mastery for ranged weapons.",
    usage: "Roll d20s equal to ATK. Count successes vs. the target's defense. Rolls of 1-3 subtract a success, 18-20 count as two successes.",
  },
  weaponDamage: {
    title: "Weapon Damage (DMG)",
    category: "Combat",
    description: "Shows Normal Damage / Critical Damage. Normal damage is dealt on a standard hit, critical damage on rolls of 18-20.",
    usage: "Damage reduces the target's Woundscale. Protection from armor subtracts from incoming damage.",
  },
  spellCast: {
    title: "Spell Cast",
    category: "Magic",
    formula: "Arcane Mastery + Language Cost",
    description: "The number of d20s rolled when casting a spell using this Language. Cost is also the Seele cost to cast.",
    usage: "Pay the Cost as Seele, then roll CAST dice. Successes determine spell effectiveness.",
  },
  spellCost: {
    title: "Spell Cost",
    category: "Magic",
    description: "The amount of Seele that must be spent to cast a spell using this Language.",
    usage: "Deducted from your current Seele when casting. Higher cost languages are more powerful but costlier.",
  },

  protection: {
    title: "Protection (PROT)",
    category: "Combat",
    description: "Flat damage reduction from your equipped armor. Incoming damage is reduced by your Protection value.",
    usage: "Subtracted from damage dealt to you before it's applied to your Woundscale.",
  },
  evasionDice: {
    title: "Evasion Dice (Eva)",
    category: "Combat",
    description: "Bonus dice granted by your armor, added to your Evade pool when rolling to avoid attacks.",
    usage: "Added to floor(Reflexes/2) to determine total Evade dice.",
  },

  renown: {
    title: "Renown",
    category: "Tracker",
    description: "Your character's reputation and standing in the world.",
    usage: "Tracks how well-known your character is. May influence social interactions and story opportunities.",
  },
  karma: {
    title: "Karma",
    category: "Tracker",
    description: "Your character's moral standing and fate.",
    usage: "Tracks the consequences of your character's choices.",
  },

  skills: {
    title: "Skills",
    category: "System",
    description: "Skills represent areas where your character excels. There are 43 skills grouped by governing Stats. Characters focus on a cross-section, not all of them.",
    usage: "When facing a challenge, propose a relevant skill. Roll d20s equal to your Stat + Skill Tier. You may use Areas of Related Competency (ARCs) to lower the Target Number by 1 per related skill.",
  },
  skillProgression: {
    title: "Skill Progression",
    category: "System",
    description: "Skills advance independently of character level. After each Encounter, skills on your datacard gain 1 Progression point.",
    usage: "When Progression points equal the current Skill Tier, the skill advances and Progression resets to 0.",
  },

  archetypes: {
    title: "Archetypes",
    category: "System",
    description: "Characters choose Archetype Features to customize their abilities. At creation, pick two Initiate features. Acolyte features unlock at Level 2, Scholar at Level 5.",
    usage: "Mix and match features from different Archetypes to create a unique character. Features do not stack and can only be taken once.",
  },

  feats: {
    title: "Feats",
    category: "Abilities",
    description: "Passive features gained from Backstory and Archetypes that give your character a unique edge.",
    usage: "Always active. Provide permanent bonuses or unlock special options.",
  },
  maneuvers: {
    title: "Maneuvers",
    category: "Abilities",
    description: "Special moves requiring Seele to activate. Allow characters to shine in their niche and create impactful moments.",
    usage: "Spend the listed Seele cost to activate. Some require prerequisite Feats.",
  },

  diceSystem: {
    title: "Dice System",
    category: "Core Rules",
    description: "All dice are d20s. Roll against Target Number 11+. Rolls of 1-3 subtract a success. Rolls of 18-20 count as two successes.",
    usage: "You may convert 2 unrolled dice into 1 automatic success, or 3 unrolled dice into 1 automatic critical success.",
  },
  level: {
    title: "Character Level",
    category: "Progression",
    description: "Tracks character progression. Level up when Progress equals your current level.",
    usage: "Each level grants benefits from the Leveling Table: new Archetype Features, stat points, and skill openings.",
  },
  progress: {
    title: "Progress",
    category: "Progression",
    description: "Points earned toward your next level. When Progress equals your current Level, you level up.",
    usage: "Granted by the GM for completing encounters and story milestones.",
  },
};

export function getRule(key: string): RuleEntry | undefined {
  return RULES[key];
}

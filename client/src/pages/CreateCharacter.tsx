import { useState, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useCreateCharacter } from "@/hooks/use-characters";
import { useWeapons, useArmor, useSkills, useArchetypes, useFeats, useManeuvers, useLanguages } from "@/hooks/use-game-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Sparkles, Dices, Check, Swords, Shield, Wand2, Target, Heart, Brain, Ghost, Flame, Feather, Zap, BookOpen, Eye, Crown, Users, ChevronDown, ChevronUp, Plus, Minus, Lock, Info } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { generateRandomCharacter, COMBAT_STYLES, ROLE_TYPES, getLevelRewards, type CombatStyle, type RoleType, type CharacterRole, type GameData } from "@/lib/characterGenerator";
import type { InsertCharacter, Weapon, Archetype, Skill, Feat, Maneuver, Language, Armor } from "@shared/schema";

const STAT_ICONS: Record<string, any> = {
  power: Flame, finesse: Feather, vitality: Heart,
  acumen: Brain, diplomacy: Users, intuition: Eye,
  talent: Sparkles, moxie: Zap, audacity: Ghost,
};

const STAT_LABELS: Record<string, string> = {
  power: "POW", finesse: "FIN", vitality: "VIT",
  acumen: "ACU", diplomacy: "DIP", intuition: "INT",
  talent: "TAL", moxie: "MOX", audacity: "AUD",
};

const STAT_CATEGORIES = [
  { label: "Body", stats: ["power", "finesse", "vitality"], color: "text-red-400" },
  { label: "Mind", stats: ["acumen", "diplomacy", "intuition"], color: "text-blue-400" },
  { label: "Spirit", stats: ["talent", "moxie", "audacity"], color: "text-violet-400" },
];

const STEPS = [
  { id: "basics", label: "Basics" },
  { id: "stats", label: "Stats" },
  { id: "archetype", label: "Archetype" },
  { id: "skills", label: "Skills" },
  { id: "feats-maneuvers", label: "Feats & Maneuvers" },
  { id: "languages", label: "Languages" },
  { id: "equipment", label: "Equipment" },
  { id: "summary", label: "Summary" },
];

const DEFAULT_ARMOR_NAMES = ["Threadbare Clothes", "Shoddy Leathers", "Rusted Plate"];

interface SelectedFeature {
  archetypeName: string;
  tier: string;
  feature: string;
}

function StepIndicator({ currentStep, steps }: { currentStep: number; steps: typeof STEPS }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2" data-testid="step-indicator">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-1 shrink-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < currentStep ? "bg-primary text-primary-foreground" :
              i === currentStep ? "bg-primary/80 text-primary-foreground ring-2 ring-primary/40" :
              "bg-muted text-muted-foreground"
            }`}
          >
            {i < currentStep ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={`text-xs hidden sm:inline ${i === currentStep ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
            {step.label}
          </span>
          {i < steps.length - 1 && <div className="w-4 h-px bg-border" />}
        </div>
      ))}
    </div>
  );
}

interface StatAllocatorProps {
  stats: Record<string, number>;
  onStatChange: (stat: string, delta: number) => void;
  bodyMindRemaining: number;
  spiritRemaining: number;
}

function StatAllocator({ stats, onStatChange, bodyMindRemaining, spiritRemaining }: StatAllocatorProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <Badge variant="outline" data-testid="badge-bodymind-remaining">Body/Mind Points: {bodyMindRemaining}</Badge>
        <Badge variant="outline" data-testid="badge-spirit-remaining">Spirit Points: {spiritRemaining}</Badge>
      </div>
      {STAT_CATEGORIES.map(cat => (
        <div key={cat.label} className="space-y-2">
          <h4 className={`text-sm font-semibold ${cat.color}`}>{cat.label}</h4>
          <div className="grid grid-cols-3 gap-2">
            {cat.stats.map(stat => {
              const Icon = STAT_ICONS[stat];
              const isSpiritStat = cat.label === "Spirit";
              const remaining = isSpiritStat ? spiritRemaining : bodyMindRemaining;
              const minVal = stat === "talent" ? 0 : 1;
              return (
                <div key={stat} className="flex items-center gap-1.5 bg-secondary/30 rounded px-2 py-1.5">
                  <Icon className={`w-3.5 h-3.5 ${cat.color} shrink-0`} />
                  <span className="text-xs font-mono w-8 shrink-0">{STAT_LABELS[stat]}</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onStatChange(stat, -1)} disabled={stats[stat] <= minVal} data-testid={`button-stat-dec-${stat}`}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-bold w-5 text-center">{stats[stat]}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onStatChange(stat, 1)} disabled={remaining <= 0} data-testid={`button-stat-inc-${stat}`}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function extractSkillNameFromFeat(featName: string): string | null {
  const combatMatch = featName.match(/^COMBAT SKILL FEAT:\s*(.+)$/i);
  if (combatMatch) return combatMatch[1].trim();
  const roleplayMatch = featName.match(/^ROLEPLAY SKILL FEAT:\s*(.+)$/i);
  if (roleplayMatch) return roleplayMatch[1].trim();
  return null;
}

const ALL_SKILL_NAMES = [
  "Melee Mastery", "Ranged Mastery", "Arcane Mastery",
  "Acrobatics", "Animal Handling", "Artistry", "Arts", "Assimilation", "Athleticism",
  "Bluff", "Business", "Composure", "Contortion", "Crafting", "Edge", "Endurance",
  "Engineering", "Footwork", "History", "Homeostasis", "Hypersense", "Insight",
  "Instinct", "Interfacing", "Intimidation", "Inventing", "Legerdemain", "Logic",
  "Mathematics", "Medicine", "Orate", "Pain Tolerance", "Piloting", "Reaction Speed",
  "Rhetoric", "Savoir Faire", "Science", "Sixth Sense", "Skullduggery",
  "Social Engineering", "Technology", "Theology",
];

function extractSkillOpeningsFromFeatures(features: SelectedFeature[]): string[] {
  const opened = new Set<string>();
  for (const f of features) {
    const text = f.feature;
    const openMatch = text.match(/Open\s+(.+?)(?:\.|$)/i);
    if (!openMatch) continue;
    let segment = openMatch[1];
    segment = segment
      .replace(/Melee\s+and\s+Ranged\s+Mastery/gi, "Melee Mastery, Ranged Mastery")
      .replace(/Melee\s+or\s+Ranged\s+Mastery/gi, "Melee Mastery, Ranged Mastery")
      .replace(/Footwork\s+or\s+Led?gerdemain/gi, "Footwork, Legerdemain");
    for (const skillName of ALL_SKILL_NAMES) {
      if (segment.includes(skillName)) {
        opened.add(skillName);
      }
    }
  }
  return Array.from(opened);
}

function archetypeFeaturesGrantLanguages(features: SelectedFeature[]): boolean {
  const langKeywords = ["learn a language", "learn an additional language", "learn one language", "learn two language", "learn three language", "language of"];
  return features.some(f => {
    const lower = f.feature.toLowerCase();
    return langKeywords.some(kw => lower.includes(kw));
  });
}

const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, an: 1, a: 1 };

function parseNumberWord(word: string): number {
  const n = NUMBER_WORDS[word.toLowerCase()];
  if (n !== undefined) return n;
  const parsed = parseInt(word, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function extractBonusesFromFeatures(features: SelectedFeature[]): { bonusFeats: number; bonusManeuvers: number; bonusLanguages: number } {
  let bonusFeats = 0;
  let bonusManeuvers = 0;
  let bonusLanguages = 0;

  for (const f of features) {
    const text = f.feature;

    const featManeuverMatch = text.match(/(\w+)\s+Feat(?:s)?\s+and\s+(\w+)\s+Maneuver(?:s)?/i);
    if (featManeuverMatch) {
      const featWord = featManeuverMatch[1].toLowerCase();
      if (featWord === "additional") {
        bonusFeats += 1;
      } else {
        bonusFeats += parseNumberWord(featManeuverMatch[1]);
      }
      bonusManeuvers += parseNumberWord(featManeuverMatch[2]);
    }

    const langAdditional = text.match(/Learn\s+an\s+additional\s+Language/i);
    if (langAdditional) {
      bonusLanguages += 1;
    } else {
      const langMatch = text.match(/Learn\s+(\w+)\s+Language(?:s)?/i);
      if (langMatch) {
        bonusLanguages += parseNumberWord(langMatch[1]);
      }
    }
  }

  return { bonusFeats, bonusManeuvers, bonusLanguages };
}

export default function CreateCharacter() {
  const [, navigate] = useLocation();
  const createMut = useCreateCharacter();

  const { data: allWeapons } = useWeapons();
  const { data: allArmor } = useArmor();
  const { data: allSkills } = useSkills();
  const { data: allArchetypes } = useArchetypes();
  const { data: allFeats } = useFeats();
  const { data: allManeuvers } = useManeuvers();
  const { data: allLanguages } = useLanguages();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [race, setRace] = useState("");
  const [level, setLevel] = useState(1);
  const [combatStyle, setCombatStyle] = useState<CombatStyle>("melee");
  const [roleType, setRoleType] = useState<RoleType>("dps");

  const [stats, setStats] = useState<Record<string, number>>({
    power: 1, finesse: 1, vitality: 1,
    acumen: 1, diplomacy: 1, intuition: 1,
    talent: 0, moxie: 1, audacity: 1,
  });

  const [pickedFeatures, setPickedFeatures] = useState<SelectedFeature[]>([]);

  const [selectedSkills, setSelectedSkills] = useState<Record<string, number>>({});
  const [selectedFeats, setSelectedFeats] = useState<string[]>([]);
  const [selectedManeuvers, setSelectedManeuvers] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const [selectedWeapons, setSelectedWeapons] = useState<any[]>([]);
  const [selectedArmor, setSelectedArmor] = useState<string>("");

  const [randomGenerated, setRandomGenerated] = useState(false);
  const [expandedSkillCat, setExpandedSkillCat] = useState<string | null>(null);
  const [weaponTypeFilter, setWeaponTypeFilter] = useState("Melee Weapon");
  const prevGrantedSkillsRef = useRef<string[]>([]);

  const gameData: GameData | null = useMemo(() => {
    if (!allWeapons || !allArmor || !allSkills || !allArchetypes || !allFeats || !allManeuvers || !allLanguages) return null;
    return { weapons: allWeapons, armor: allArmor, skills: allSkills, archetypes: allArchetypes, feats: allFeats, maneuvers: allManeuvers, languages: allLanguages };
  }, [allWeapons, allArmor, allSkills, allArchetypes, allFeats, allManeuvers, allLanguages]);

  const rewards = useMemo(() => getLevelRewards(level), [level]);
  const totalBodyMindPoints = rewards.reduce((s, r) => s + r.bodyMindStatPoints, 0);
  const totalSpiritPoints = rewards.reduce((s, r) => s + r.spiritStatPoints, 0);

  const usedBodyMindPoints = (stats.power - 1) + (stats.finesse - 1) + (stats.vitality - 1) +
    (stats.acumen - 1) + (stats.diplomacy - 1) + (stats.intuition - 1);
  const usedSpiritPoints = stats.talent + (stats.moxie - 1) + (stats.audacity - 1);

  const bodyMindRemaining = totalBodyMindPoints - usedBodyMindPoints;
  const spiritRemaining = totalSpiritPoints - usedSpiritPoints;

  const totalSkillOpenings = rewards.reduce((s, r) => s + r.skillOpenings, 0);
  const totalSkillFeats = rewards.reduce((s, r) => s + r.skillFeats, 0);
  const totalFeatsCount = rewards.reduce((s, r) => s + r.feats, 0);
  const totalManeuverCount = rewards.reduce((s, r) => s + r.maneuvers, 0);

  const initiateFeatureSlots = rewards.reduce((sum, r) => sum + (r.archetypeTier === "initiate" ? r.archetypeFeatureCount : 0), 0);
  const acolyteFeatureSlots = rewards.reduce((sum, r) => sum + (r.archetypeTier === "acolyte" ? r.archetypeFeatureCount : 0), 0);
  const scholarFeatureSlots = rewards.reduce((sum, r) => sum + (r.archetypeTier === "scholar" ? r.archetypeFeatureCount : 0), 0);
  const totalFeatureSlots = initiateFeatureSlots + acolyteFeatureSlots + scholarFeatureSlots;

  const hasAccessToTier = (tier: string) => {
    if (tier === "Initiate") return initiateFeatureSlots > 0 || acolyteFeatureSlots > 0 || scholarFeatureSlots > 0;
    if (tier === "Acolyte") return acolyteFeatureSlots > 0 || scholarFeatureSlots > 0;
    if (tier === "Scholar") return scholarFeatureSlots > 0;
    return false;
  };

  const archetypeGrantedSkills = useMemo(() => extractSkillOpeningsFromFeatures(pickedFeatures), [pickedFeatures]);
  const archetypeBonuses = useMemo(() => extractBonusesFromFeatures(pickedFeatures), [pickedFeatures]);

  const initiateArchetypes = allArchetypes?.filter(a => a.tier === "Initiate") || [];
  const acolyteArchetypes = allArchetypes?.filter(a => a.tier === "Acolyte") || [];
  const scholarArchetypes = allArchetypes?.filter(a => a.tier === "Scholar") || [];

  const handleStatChange = (stat: string, delta: number) => {
    const isSpiritStat = ["talent", "moxie", "audacity"].includes(stat);
    const minVal = stat === "talent" ? 0 : 1;
    const newVal = stats[stat] + delta;
    if (newVal < minVal) return;
    if (delta > 0) {
      if (isSpiritStat && spiritRemaining <= 0) return;
      if (!isSpiritStat && bodyMindRemaining <= 0) return;
    }
    setStats(prev => ({ ...prev, [stat]: newVal }));
  };

  const toggleSkill = (skillName: string) => {
    setSelectedSkills(prev => {
      const copy = { ...prev };
      if (copy[skillName]) {
        delete copy[skillName];
      } else {
        copy[skillName] = 1;
      }
      return copy;
    });
  };

  const changeSkillTier = (skillName: string, delta: number) => {
    setSelectedSkills(prev => {
      const newTier = Math.max(1, Math.min(5, (prev[skillName] || 1) + delta));
      return { ...prev, [skillName]: newTier };
    });
  };

  const toggleFeat = (featName: string) => {
    setSelectedFeats(prev =>
      prev.includes(featName) ? prev.filter(f => f !== featName) : [...prev, featName]
    );
  };

  const toggleManeuver = (mName: string) => {
    setSelectedManeuvers(prev =>
      prev.includes(mName) ? prev.filter(m => m !== mName) : [...prev, mName]
    );
  };

  const toggleLanguage = (lName: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lName) ? prev.filter(l => l !== lName) : [...prev, lName]
    );
  };

  const toggleFeature = (archetypeName: string, tier: string, feature: string) => {
    setPickedFeatures(prev => {
      const exists = prev.some(f => f.feature === feature && f.archetypeName === archetypeName);
      if (exists) {
        return prev.filter(f => !(f.feature === feature && f.archetypeName === archetypeName));
      }
      if (prev.length >= totalFeatureSlots) return prev;
      return [...prev, { archetypeName, tier, feature }];
    });
  };

  const addWeapon = (w: Weapon) => {
    if (selectedWeapons.some(sw => sw.name === w.name)) return;
    setSelectedWeapons(prev => [...prev, {
      name: w.name, type: w.type, dice: w.dice,
      mastery: w.mastery, normalDamage: w.normalDamage,
      critDamage: w.critDamage, damageType: w.damageType,
      effects: w.effects, attacks: w.attacks ?? 0,
    }]);
  };

  const removeWeapon = (wName: string) => {
    setSelectedWeapons(prev => prev.filter(w => w.name !== wName));
  };

  const handleRandomGenerate = () => {
    if (!gameData || !name.trim()) return;
    const role: CharacterRole = { combatStyle, roleType };
    const char = generateRandomCharacter(name.trim(), race.trim(), level, role, gameData);

    setStats({
      power: char.power ?? 1, finesse: char.finesse ?? 1, vitality: char.vitality ?? 1,
      acumen: char.acumen ?? 1, diplomacy: char.diplomacy ?? 1, intuition: char.intuition ?? 1,
      talent: char.talent ?? 0, moxie: char.moxie ?? 1, audacity: char.audacity ?? 1,
    });

    const sa = (char.selectedArchetypes as any[]) || [];
    const newFeatures: SelectedFeature[] = [];
    for (const arch of sa) {
      for (const feat of (arch.selectedFeatures || [])) {
        newFeatures.push({ archetypeName: arch.name, tier: arch.tier, feature: feat });
      }
    }
    setPickedFeatures(newFeatures);

    setSelectedSkills((char.skillTiers as Record<string, number>) || {});
    setSelectedFeats((char.knownFeats as string[]) || []);
    setSelectedManeuvers((char.knownManeuvers as string[]) || []);
    setSelectedLanguages((char.knownLanguages as string[]) || []);
    setSelectedWeapons((char.equippedWeapons as any[]) || []);
    setSelectedArmor(char.armorName || "");

    setRandomGenerated(true);
    setStep(STEPS.length - 1);
  };

  const buildCharacter = (): InsertCharacter => {
    const archetypeMap: Record<string, { name: string; tier: string; selectedFeatures: string[] }> = {};
    for (const pf of pickedFeatures) {
      const key = `${pf.archetypeName}|${pf.tier}`;
      if (!archetypeMap[key]) {
        archetypeMap[key] = { name: pf.archetypeName, tier: pf.tier, selectedFeatures: [] };
      }
      archetypeMap[key].selectedFeatures.push(pf.feature);
    }
    const archetypesList = Object.values(archetypeMap);
    const allFeatures = pickedFeatures.map(f => f.feature);

    const chosenArmor = allArmor?.find(a => a.name === selectedArmor);
    const bodySum = stats.power + stats.finesse + stats.vitality;
    const mindSum = stats.acumen + stats.diplomacy + stats.intuition;
    const spiritSum = stats.talent + stats.moxie + stats.audacity;
    const seeleMax = Math.ceil((bodySum + mindSum + spiritSum) / 2);

    return {
      name: name.trim(),
      race: race.trim(),
      archetype: archetypesList[0]?.name || "",
      level,
      progress: 0,
      ...stats,
      seeleMax,
      seeleCurrent: seeleMax,
      renown: 0, karma: 0, woundsCurrent: 0,
      skulkMax: 0, skulkCurrent: 0,
      armorName: chosenArmor?.name || "",
      armorProtection: chosenArmor?.protection ?? 0,
      armorEvasionDice: chosenArmor?.evasionDice ?? 1,
      armorEffects: chosenArmor?.effects || "",
      skillTiers: selectedSkills,
      equippedWeapons: selectedWeapons,
      knownLanguages: selectedLanguages,
      knownFeats: selectedFeats,
      knownManeuvers: selectedManeuvers,
      inventory: [],
      archetypeFeatures: allFeatures,
      selectedArchetypes: archetypesList,
      notes: "",
    };
  };

  const handleCreate = () => {
    const char = buildCharacter();
    createMut.mutate(char, {
      onSuccess: (created) => {
        navigate(`/character/${created.id}`);
      },
    });
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0;
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 0: return renderBasics();
      case 1: return renderStats();
      case 2: return renderArchetype();
      case 3: return renderSkillsOnly();
      case 4: return renderFeatsManeuvers();
      case 5: return renderLanguages();
      case 6: return renderEquipment();
      case 7: return renderSummary();
      default: return null;
    }
  };

  const renderBasics = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Character Name</Label>
        <Input data-testid="input-create-name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter character name" />
      </div>
      <div className="space-y-2">
        <Label>Race</Label>
        <Input data-testid="input-create-race" value={race} onChange={e => setRace(e.target.value)} placeholder="Human, Elf, Orc..." />
      </div>
      <div className="space-y-2">
        <Label>Starting Level</Label>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => setLevel(Math.max(0, level - 1))} disabled={level <= 0} data-testid="button-level-dec"><Minus className="w-4 h-4" /></Button>
          <span className="text-lg font-bold w-8 text-center" data-testid="text-level">{level}</span>
          <Button size="icon" variant="ghost" onClick={() => setLevel(Math.min(9, level + 1))} disabled={level >= 9} data-testid="button-level-inc"><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="border-t border-border/40 pt-4 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Level Bonuses</h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {rewards.map((r, i) => (
            <div key={i} className="text-xs bg-secondary/30 rounded px-3 py-2" data-testid={`reward-level-${r.level}`}>
              <span className="font-semibold text-primary">Level {r.level}:</span>
              <span className="text-muted-foreground ml-2">
                {[
                  r.bodyMindStatPoints > 0 && `+${r.bodyMindStatPoints} Body/Mind stats`,
                  r.spiritStatPoints > 0 && `+${r.spiritStatPoints} Spirit stats`,
                  r.skillOpenings > 0 && `+${r.skillOpenings} skill opening`,
                  r.skillFeats > 0 && `+${r.skillFeats} skill feats`,
                  r.feats > 0 && `+${r.feats} feat`,
                  r.maneuvers > 0 && `+${r.maneuvers} maneuvers`,
                  r.archetypeTier && `${r.archetypeTier} archetype (${r.archetypeFeatureCount} features)`,
                  r.combatMastery > 0 && `+${r.combatMastery} combat mastery`,
                ].filter(Boolean).join(", ")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Card className="p-4 space-y-3 border-primary/30">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
          <Dices className="w-4 h-4 text-primary" /> Quick Generate
        </h3>
        <p className="text-xs text-muted-foreground">Pick a role and generate a complete character instantly.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Combat Style</Label>
            <Select value={combatStyle} onValueChange={v => setCombatStyle(v as CombatStyle)}>
              <SelectTrigger data-testid="select-combat-style"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMBAT_STYLES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <Select value={roleType} onValueChange={v => setRoleType(v as RoleType)}>
              <SelectTrigger data-testid="select-role-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_TYPES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="w-full" onClick={handleRandomGenerate} disabled={!name.trim() || !gameData} data-testid="button-random-generate">
          <Dices className="w-4 h-4 mr-2" /> Generate {combatStyle} {roleType}
        </Button>
      </Card>
    </div>
  );

  const renderStats = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Distribute your stat points. All Body and Mind stats start at 1, Spirit stats start at 1 (Talent starts at 0).
      </p>
      <StatAllocator
        stats={stats}
        onStatChange={handleStatChange}
        bodyMindRemaining={bodyMindRemaining}
        spiritRemaining={spiritRemaining}
      />
    </div>
  );

  const renderArchetype = () => {
    const slotsRemaining = totalFeatureSlots - pickedFeatures.length;

    const renderArchetypeGroup = (tier: string, archetypes: Archetype[]) => {
      if (!hasAccessToTier(tier)) return null;

      return (
        <div key={tier} className="space-y-3">
          <h4 className="text-sm font-semibold text-primary">{tier} Archetypes</h4>
          <div className="space-y-2">
            {archetypes.map(arch => {
              const archFeatures = (arch.features as string[]) || [];
              const pickedFromThis = pickedFeatures.filter(f => f.archetypeName === arch.name && f.tier === tier);

              return (
                <Collapsible key={arch.name}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold py-1.5 hover-elevate rounded px-2" data-testid={`toggle-arch-${tier}-${arch.name}`}>
                    <span className="flex items-center gap-2">
                      {arch.name}
                      {pickedFromThis.length > 0 && (
                        <Badge variant="secondary" className="text-[10px]">{pickedFromThis.length} picked</Badge>
                      )}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pt-1 pl-2 border-l-2 border-primary/20">
                    {archFeatures.map((feat, i) => {
                      const isSelected = pickedFeatures.some(f => f.feature === feat && f.archetypeName === arch.name);
                      const canSelect = isSelected || slotsRemaining > 0;
                      return (
                        <label key={i} className="flex items-start gap-2 text-xs cursor-pointer py-1">
                          <Checkbox
                            checked={isSelected}
                            disabled={!canSelect}
                            onCheckedChange={() => toggleFeature(arch.name, tier, feat)}
                            data-testid={`check-feature-${arch.name}-${i}`}
                          />
                          <span className={`leading-tight ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                            {feat}
                          </span>
                        </label>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Pick individual features from any archetype you have access to. You can mix and match across archetypes within a tier, or spend higher-tier slots on lower-tier features.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Badge variant="outline" data-testid="badge-feature-slots">
              Feature Slots: {pickedFeatures.length} / {totalFeatureSlots}
            </Badge>
            {initiateFeatureSlots > 0 && <Badge variant="outline">Initiate: {initiateFeatureSlots}</Badge>}
            {acolyteFeatureSlots > 0 && <Badge variant="outline">Acolyte: {acolyteFeatureSlots}</Badge>}
            {scholarFeatureSlots > 0 && <Badge variant="outline">Scholar: {scholarFeatureSlots}</Badge>}
          </div>
        </div>
        {renderArchetypeGroup("Initiate", initiateArchetypes)}
        {renderArchetypeGroup("Acolyte", acolyteArchetypes)}
        {renderArchetypeGroup("Scholar", scholarArchetypes)}
      </div>
    );
  };

  const renderSkillsOnly = () => {
    const skillCategories = ["Technique", "Relations", "Knowledge", "Awareness", "Physique", "Motorics"];
    const combatSkills = ["Melee Mastery", "Ranged Mastery", "Arcane Mastery"];

    return (
      <div className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <Badge variant="outline">Skill Slots: {Object.keys(selectedSkills).length} / {totalSkillOpenings + totalSkillFeats + 6}</Badge>
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-primary">Combat Masteries</h4>
          <div className="grid grid-cols-3 gap-2">
            {combatSkills.map(s => {
              const isGranted = archetypeGrantedSkills.includes(s);
              return (
              <div key={s} className={`flex items-center justify-between rounded px-2 py-1.5 ${isGranted ? "bg-primary/10 border border-primary/20" : "bg-secondary/30"}`}>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <Checkbox checked={!!selectedSkills[s]} onCheckedChange={() => { if (!isGranted) toggleSkill(s); }} disabled={isGranted} data-testid={`check-skill-${s}`} />
                  {s}
                  {isGranted && <span className="text-[10px] text-primary/70">(archetype)</span>}
                </label>
                {selectedSkills[s] && (
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => changeSkillTier(s, -1)} data-testid={`btn-tier-dec-${s}`}><Minus className="w-3 h-3" /></Button>
                    <span className="text-xs font-bold w-3 text-center">{selectedSkills[s]}</span>
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => changeSkillTier(s, 1)} data-testid={`btn-tier-inc-${s}`}><Plus className="w-3 h-3" /></Button>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        </div>

        {skillCategories.map(cat => {
          const catSkills = allSkills?.filter(s => s.category === cat) || [];
          if (catSkills.length === 0) return null;
          return (
            <Collapsible key={cat} open={expandedSkillCat === cat} onOpenChange={(open) => setExpandedSkillCat(open ? cat : null)}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold py-1.5 hover-elevate rounded px-2" data-testid={`toggle-skill-cat-${cat}`}>
                <span>{cat} <span className="text-xs text-muted-foreground font-normal">({catSkills.filter(s => selectedSkills[s.name]).length} selected)</span></span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1">
                {catSkills.map(skill => {
                  const isGranted = archetypeGrantedSkills.includes(skill.name);
                  return (
                  <div key={skill.name} className={`flex items-center justify-between rounded px-2 py-1 ${isGranted ? "bg-primary/10 border border-primary/20" : "bg-secondary/20"}`}>
                    <label className="flex items-center gap-2 cursor-pointer text-xs flex-1">
                      <Checkbox checked={!!selectedSkills[skill.name]} onCheckedChange={() => { if (!isGranted) toggleSkill(skill.name); }} disabled={isGranted} data-testid={`check-skill-${skill.name}`} />
                      <span>{skill.name}</span>
                      <span className="text-muted-foreground">({skill.stat})</span>
                      {isGranted && <span className="text-[10px] text-primary/70">(archetype)</span>}
                    </label>
                    {selectedSkills[skill.name] && (
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => changeSkillTier(skill.name, -1)}><Minus className="w-3 h-3" /></Button>
                        <span className="text-xs font-bold w-3 text-center">{selectedSkills[skill.name]}</span>
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => changeSkillTier(skill.name, 1)}><Plus className="w-3 h-3" /></Button>
                      </div>
                    )}
                  </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    );
  };

  const renderFeatsManeuvers = () => {
    const selectedSkillNames = new Set(Object.keys(selectedSkills));

    const availableGeneralFeats = allFeats?.filter(f =>
      f.featType !== "COMBAT SKILL" && f.featType !== "ROLEPLAY SKILL" && f.featType !== "MARTIAL ARTS"
    ) || [];

    const combatSkillFeats = allFeats?.filter(f => f.featType === "COMBAT SKILL") || [];
    const roleplaySkillFeats = allFeats?.filter(f => f.featType === "ROLEPLAY SKILL") || [];
    const martialArtsFeats = allFeats?.filter(f => f.featType === "MARTIAL ARTS") || [];

    const eligibleCombatSkillFeats = combatSkillFeats.filter(f => {
      const skillName = extractSkillNameFromFeat(f.name);
      return skillName && selectedSkillNames.has(skillName);
    });

    const eligibleRoleplaySkillFeats = roleplaySkillFeats.filter(f => {
      const skillName = extractSkillNameFromFeat(f.name);
      return skillName && selectedSkillNames.has(skillName);
    });

    const eligibleManeuvers = allManeuvers?.filter(m => {
      if (!m.prerequisite || m.prerequisite.trim() === "") return true;
      return selectedFeats.includes(m.prerequisite);
    }) || [];

    const lockedManeuvers = allManeuvers?.filter(m => {
      if (!m.prerequisite || m.prerequisite.trim() === "") return false;
      return !selectedFeats.includes(m.prerequisite);
    }) || [];

    return (
      <div className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <Badge variant="outline">Feats: {selectedFeats.length} / {Math.max(1, totalFeatsCount + totalSkillFeats + archetypeBonuses.bonusFeats)}</Badge>
          <Badge variant="outline">Maneuvers: {selectedManeuvers.length} / {Math.max(2, totalManeuverCount + archetypeBonuses.bonusManeuvers)}</Badge>
        </div>

        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold py-1.5 hover-elevate rounded px-2" data-testid="toggle-feats-section">
            <span>General Feats <span className="text-xs text-muted-foreground font-normal">({selectedFeats.filter(f => availableGeneralFeats.some(gf => gf.name === f)).length} selected)</span></span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pt-1 max-h-60 overflow-y-auto">
            {availableGeneralFeats.map(feat => (
              <label key={feat.name} className="flex items-start gap-2 text-xs cursor-pointer bg-secondary/20 rounded px-2 py-1.5">
                <Checkbox checked={selectedFeats.includes(feat.name)} onCheckedChange={() => toggleFeat(feat.name)} className="mt-0.5" data-testid={`check-feat-${feat.name}`} />
                <div>
                  <span className="font-semibold">{feat.name}</span>
                  {feat.effect && <p className="text-muted-foreground mt-0.5 leading-tight">{feat.effect.slice(0, 120)}{feat.effect.length > 120 ? "..." : ""}</p>}
                </div>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {eligibleCombatSkillFeats.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold py-1.5 hover-elevate rounded px-2" data-testid="toggle-combat-skill-feats">
              <span>Combat Skill Feats <span className="text-xs text-muted-foreground font-normal">({selectedFeats.filter(f => eligibleCombatSkillFeats.some(cf => cf.name === f)).length} eligible)</span></span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-1 max-h-60 overflow-y-auto">
              {eligibleCombatSkillFeats.map(feat => (
                <label key={feat.name} className="flex items-start gap-2 text-xs cursor-pointer bg-secondary/20 rounded px-2 py-1.5">
                  <Checkbox checked={selectedFeats.includes(feat.name)} onCheckedChange={() => toggleFeat(feat.name)} className="mt-0.5" data-testid={`check-feat-${feat.name}`} />
                  <div>
                    <span className="font-semibold">{feat.name}</span>
                    {feat.effect && <p className="text-muted-foreground mt-0.5 leading-tight">{feat.effect.slice(0, 120)}{feat.effect.length > 120 ? "..." : ""}</p>}
                  </div>
                </label>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {eligibleRoleplaySkillFeats.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold py-1.5 hover-elevate rounded px-2" data-testid="toggle-roleplay-skill-feats">
              <span>Roleplay Skill Feats <span className="text-xs text-muted-foreground font-normal">({selectedFeats.filter(f => eligibleRoleplaySkillFeats.some(rf => rf.name === f)).length} eligible)</span></span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-1 max-h-60 overflow-y-auto">
              {eligibleRoleplaySkillFeats.map(feat => (
                <label key={feat.name} className="flex items-start gap-2 text-xs cursor-pointer bg-secondary/20 rounded px-2 py-1.5">
                  <Checkbox checked={selectedFeats.includes(feat.name)} onCheckedChange={() => toggleFeat(feat.name)} className="mt-0.5" data-testid={`check-feat-${feat.name}`} />
                  <div>
                    <span className="font-semibold">{feat.name}</span>
                    {feat.effect && <p className="text-muted-foreground mt-0.5 leading-tight">{feat.effect.slice(0, 120)}{feat.effect.length > 120 ? "..." : ""}</p>}
                  </div>
                </label>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold py-1.5 hover-elevate rounded px-2" data-testid="toggle-martial-arts-feats">
            <span>Martial Arts <span className="text-xs text-muted-foreground font-normal">({selectedFeats.filter(f => martialArtsFeats.some(mf => mf.name === f)).length} selected)</span></span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pt-1 max-h-60 overflow-y-auto">
            {martialArtsFeats.map(feat => (
              <label key={feat.name} className="flex items-start gap-2 text-xs cursor-pointer bg-secondary/20 rounded px-2 py-1.5">
                <Checkbox checked={selectedFeats.includes(feat.name)} onCheckedChange={() => toggleFeat(feat.name)} className="mt-0.5" data-testid={`check-feat-${feat.name}`} />
                <div>
                  <span className="font-semibold">{feat.name}</span>
                  {feat.effect && <p className="text-muted-foreground mt-0.5 leading-tight">{feat.effect.slice(0, 120)}{feat.effect.length > 120 ? "..." : ""}</p>}
                </div>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold py-1.5 hover-elevate rounded px-2" data-testid="toggle-maneuvers-section">
            <span>Maneuvers <span className="text-xs text-muted-foreground font-normal">({selectedManeuvers.length} selected)</span></span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pt-1 max-h-60 overflow-y-auto">
            {eligibleManeuvers.map(m => (
              <label key={m.name} className="flex items-start gap-2 text-xs cursor-pointer bg-secondary/20 rounded px-2 py-1.5">
                <Checkbox checked={selectedManeuvers.includes(m.name)} onCheckedChange={() => toggleManeuver(m.name)} className="mt-0.5" data-testid={`check-maneuver-${m.name}`} />
                <div>
                  <span className="font-semibold">{m.name}</span>
                  {m.prerequisite && <Badge variant="outline" className="text-[10px] ml-1">Req: {m.prerequisite}</Badge>}
                  {m.effect && <p className="text-muted-foreground mt-0.5 leading-tight">{m.effect.slice(0, 100)}{m.effect.length > 100 ? "..." : ""}</p>}
                </div>
              </label>
            ))}
            {lockedManeuvers.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1"><Lock className="w-3 h-3" /> Locked maneuvers (need prerequisite martial art feat)</p>
                {lockedManeuvers.map(m => (
                  <div key={m.name} className="flex items-start gap-2 text-xs bg-secondary/10 rounded px-2 py-1 opacity-50">
                    <Lock className="w-3 h-3 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold">{m.name}</span>
                      <Badge variant="outline" className="text-[10px] ml-1">Req: {m.prerequisite}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  const renderLanguages = () => {
    const languagesGranted = archetypeFeaturesGrantLanguages(pickedFeatures);

    return (
      <div className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <Badge variant="outline">Languages: {selectedLanguages.length} / {archetypeBonuses.bonusLanguages}</Badge>
        </div>

        {!languagesGranted && (
          <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 rounded px-3 py-2 mb-1" data-testid="languages-locked-message">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Magical languages require archetype features that grant language learning (e.g. Mage's "Magical Education", Priest's "Faith").</span>
          </div>
        )}
        {allLanguages?.map(lang => (
          <label key={lang.name} className={`flex items-center gap-2 text-xs cursor-pointer bg-secondary/20 rounded px-2 py-1.5 ${!languagesGranted ? "opacity-50" : ""}`}>
            <Checkbox
              checked={selectedLanguages.includes(lang.name)}
              onCheckedChange={() => toggleLanguage(lang.name)}
              disabled={!languagesGranted}
              data-testid={`check-lang-${lang.name}`}
            />
            <span className="font-semibold">{lang.name}</span>
            <span className="text-muted-foreground">- {lang.domain}</span>
            <Badge variant="outline" className="text-[10px] ml-auto">Cost {lang.difficulty}</Badge>
          </label>
        ))}
      </div>
    );
  };

  const renderEquipment = () => {
    const weaponTypes = ["Melee Weapon", "Projectile Weapon", "Blackpowder Weapon"];
    const filteredWeapons = allWeapons?.filter(w => w.type === weaponTypeFilter && w.dice && w.dice > 0) || [];

    const starterArmor = allArmor?.filter(a => DEFAULT_ARMOR_NAMES.includes(a.name)) || [];
    const otherArmor = allArmor?.filter(a => !DEFAULT_ARMOR_NAMES.includes(a.name)) || [];

    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-primary flex items-center gap-2"><Swords className="w-4 h-4" /> Weapons</h4>
          {selectedWeapons.length > 0 && (
            <div className="space-y-1">
              {selectedWeapons.map((w, i) => (
                <div key={i} className="flex items-center justify-between bg-secondary/30 rounded px-3 py-1.5 text-sm" data-testid={`equipped-weapon-${i}`}>
                  <div>
                    <span className="font-semibold">{w.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{w.dice}D - {w.type}</span>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeWeapon(w.name)} data-testid={`btn-remove-weapon-${i}`}>
                    <Minus className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            {weaponTypes.map(t => (
              <Button key={t} variant={weaponTypeFilter === t ? "default" : "outline"} className="text-xs" onClick={() => setWeaponTypeFilter(t)} data-testid={`btn-filter-${t}`}>
                {t.replace(" Weapon", "")}
              </Button>
            ))}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {filteredWeapons.map(w => (
              <div key={w.name} className="flex items-center justify-between bg-secondary/20 rounded px-2 py-1.5 text-xs" data-testid={`weapon-option-${w.name}`}>
                <div>
                  <span className="font-semibold">{w.name}</span>
                  <span className="text-muted-foreground ml-2">{w.dice}D {w.mastery}</span>
                  {w.effects && <span className="text-muted-foreground ml-1">- {w.effects}</span>}
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => addWeapon(w)} disabled={selectedWeapons.some(sw => sw.name === w.name)} data-testid={`btn-add-weapon-${w.name}`}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-primary flex items-center gap-2"><Shield className="w-4 h-4" /> Armor</h4>
          <Select value={selectedArmor} onValueChange={setSelectedArmor}>
            <SelectTrigger data-testid="select-armor"><SelectValue placeholder="Choose armor..." /></SelectTrigger>
            <SelectContent>
              {starterArmor.length > 0 && (
                <>
                  <SelectItem value="__starter_header" disabled className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Starter Armor</SelectItem>
                  {starterArmor.map(a => (
                    <SelectItem key={a.name} value={a.name}>
                      {a.name} (Prot: {a.protection}, Evade: {a.evasionDice}D)
                    </SelectItem>
                  ))}
                </>
              )}
              {otherArmor.length > 0 && (
                <>
                  <SelectItem value="__other_header" disabled className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Advanced Armor</SelectItem>
                  {otherArmor.map(a => (
                    <SelectItem key={a.name} value={a.name}>
                      {a.name} (Prot: {a.protection}, Evade: {a.evasionDice}D)
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
          {selectedArmor && (() => {
            const arm = allArmor?.find(a => a.name === selectedArmor);
            return arm ? (
              <div className="text-xs text-muted-foreground bg-secondary/30 rounded px-3 py-2">
                <p className="font-semibold">{arm.name}</p>
                <p>Protection: {arm.protection} | Evasion Dice: {arm.evasionDice}</p>
                {arm.effects && <p className="mt-1">{arm.effects}</p>}
              </div>
            ) : null;
          })()}
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    const char = buildCharacter();

    return (
      <div className="space-y-4">
        {randomGenerated && (
          <Badge variant="secondary" data-testid="badge-random">Randomly Generated ({combatStyle} {roleType})</Badge>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-primary mb-1">Identity</h4>
            <p className="text-sm"><span className="text-muted-foreground">Name:</span> {char.name}</p>
            <p className="text-sm"><span className="text-muted-foreground">Race:</span> {char.race || "—"}</p>
            <p className="text-sm"><span className="text-muted-foreground">Level:</span> {char.level}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-primary mb-1">Resources</h4>
            <p className="text-sm"><span className="text-muted-foreground">Seele:</span> {char.seeleMax}</p>
            <p className="text-sm"><span className="text-muted-foreground">Armor:</span> {char.armorName || "None"}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-primary mb-2">Stats</h4>
          <div className="grid grid-cols-3 gap-2">
            {STAT_CATEGORIES.map(cat => (
              <div key={cat.label}>
                <span className={`text-xs font-semibold ${cat.color}`}>{cat.label}</span>
                <div className="flex gap-2 mt-1">
                  {cat.stats.map(s => (
                    <span key={s} className="text-xs font-mono">
                      <span className={cat.color}>{STAT_LABELS[s]}</span> <span className="font-bold">{(char as any)[s]}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {((char.selectedArchetypes as any[]) || []).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-primary mb-1">Archetypes</h4>
            {((char.selectedArchetypes as any[]) || []).map((a: any, i: number) => (
              <div key={i} className="text-xs bg-secondary/30 rounded px-2 py-1.5 mb-1">
                <span className="font-semibold">{a.name}</span> <Badge variant="outline" className="text-[10px]">{a.tier}</Badge>
                {a.selectedFeatures?.length > 0 && (
                  <ul className="mt-1 text-muted-foreground space-y-0.5 list-disc list-inside">
                    {a.selectedFeatures.map((f: string, fi: number) => <li key={fi}>{f.slice(0, 80)}{f.length > 80 ? "..." : ""}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {Object.keys(char.skillTiers as object || {}).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-primary mb-1">Skills</h4>
              {Object.entries((char.skillTiers as Record<string, number>) || {}).map(([s, t]) => (
                <p key={s} className="text-xs">{s}: <span className="font-bold">{t}</span></p>
              ))}
            </div>
          )}
          {((char.equippedWeapons as any[]) || []).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-primary mb-1">Weapons</h4>
              {((char.equippedWeapons as any[]) || []).map((w: any, i: number) => (
                <p key={i} className="text-xs">{w.name} ({w.dice}D)</p>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {((char.knownFeats as string[]) || []).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-primary mb-1">Feats</h4>
              {((char.knownFeats as string[]) || []).map((f, i) => <p key={i} className="text-xs">{f}</p>)}
            </div>
          )}
          {((char.knownManeuvers as string[]) || []).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-primary mb-1">Maneuvers</h4>
              {((char.knownManeuvers as string[]) || []).map((m, i) => <p key={i} className="text-xs">{m}</p>)}
            </div>
          )}
        </div>

        {((char.knownLanguages as string[]) || []).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-primary mb-1">Languages</h4>
            <div className="flex gap-1.5 flex-wrap">
              {((char.knownLanguages as string[]) || []).map((l, i) => <Badge key={i} variant="outline" className="text-xs">{l}</Badge>)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl text-primary" style={{ fontFamily: "var(--font-display)" }}>Create Character</h1>
        </div>

        <StepIndicator currentStep={step} steps={STEPS} />

        <Card className="p-5">
          {renderStep()}
        </Card>

        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} data-testid="button-prev-step">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => {
              const nextStep = step + 1;
              if (nextStep === 3) {
                setSelectedSkills(prev => {
                  const updated = { ...prev };
                  const granted = new Set(archetypeGrantedSkills);
                  for (const sk of prevGrantedSkillsRef.current) {
                    if (!granted.has(sk) && updated[sk]) {
                      delete updated[sk];
                    }
                  }
                  for (const sk of archetypeGrantedSkills) {
                    if (!updated[sk]) updated[sk] = 1;
                  }
                  prevGrantedSkillsRef.current = archetypeGrantedSkills;
                  return updated;
                });
              }
              setStep(nextStep);
            }} disabled={!canProceed()} data-testid="button-next-step">
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={createMut.isPending || !name.trim()} data-testid="button-create-character">
              {createMut.isPending ? "Forging..." : "Create Character"} <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
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
import { ArrowLeft, ArrowRight, Sparkles, Dices, Check, Swords, Shield, Wand2, Target, Heart, Brain, Ghost, Flame, Feather, Zap, BookOpen, Eye, Crown, Users, ChevronDown, ChevronUp, Plus, Minus } from "lucide-react";
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
  { id: "equipment", label: "Equipment" },
  { id: "summary", label: "Summary" },
];

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

  const [selectedInitiate, setSelectedInitiate] = useState<string>("");
  const [selectedAcolyte, setSelectedAcolyte] = useState<string>("");
  const [selectedScholar, setSelectedScholar] = useState<string>("");
  const [initiateFeatures, setInitiateFeatures] = useState<string[]>([]);
  const [acolyteFeatures, setAcolyteFeatures] = useState<string[]>([]);
  const [scholarFeatures, setScholarFeatures] = useState<string[]>([]);

  const [selectedSkills, setSelectedSkills] = useState<Record<string, number>>({});
  const [selectedFeats, setSelectedFeats] = useState<string[]>([]);
  const [selectedManeuvers, setSelectedManeuvers] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const [selectedWeapons, setSelectedWeapons] = useState<any[]>([]);
  const [selectedArmor, setSelectedArmor] = useState<string>("");

  const [randomGenerated, setRandomGenerated] = useState(false);

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

  const needsInitiate = rewards.some(r => r.archetypeTier === "initiate");
  const needsAcolyte = rewards.some(r => r.archetypeTier === "acolyte");
  const needsScholar = rewards.some(r => r.archetypeTier === "scholar");
  const acolyteFeatureSlots = rewards.filter(r => r.archetypeTier === "acolyte").length;
  const scholarFeatureSlots = rewards.filter(r => r.archetypeTier === "scholar").length;

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
    const init = sa.find((a: any) => a.tier === "Initiate");
    const aco = sa.find((a: any) => a.tier === "Acolyte");
    const sch = sa.find((a: any) => a.tier === "Scholar");

    setSelectedInitiate(init?.name || "");
    setSelectedAcolyte(aco?.name || "");
    setSelectedScholar(sch?.name || "");
    setInitiateFeatures(init?.selectedFeatures || []);
    setAcolyteFeatures(aco?.selectedFeatures || []);
    setScholarFeatures(sch?.selectedFeatures || []);

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
    const archetypesList: any[] = [];
    const allFeatures: string[] = [];

    if (selectedInitiate) {
      const arch = allArchetypes?.find(a => a.name === selectedInitiate && a.tier === "Initiate");
      if (arch) {
        archetypesList.push({ name: arch.name, tier: "Initiate", selectedFeatures: initiateFeatures });
        allFeatures.push(...initiateFeatures);
      }
    }
    if (selectedAcolyte) {
      const arch = allArchetypes?.find(a => a.name === selectedAcolyte && a.tier === "Acolyte");
      if (arch) {
        archetypesList.push({ name: arch.name, tier: "Acolyte", selectedFeatures: acolyteFeatures });
        allFeatures.push(...acolyteFeatures);
      }
    }
    if (selectedScholar) {
      const arch = allArchetypes?.find(a => a.name === selectedScholar && a.tier === "Scholar");
      if (arch) {
        archetypesList.push({ name: arch.name, tier: "Scholar", selectedFeatures: scholarFeatures });
        allFeatures.push(...scholarFeatures);
      }
    }

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
      case 3: return renderSkills();
      case 4: return renderEquipment();
      case 5: return renderSummary();
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
    const renderArchetypeSelector = (
      tier: string,
      options: Archetype[],
      selected: string,
      onSelect: (name: string) => void,
      features: string[],
      onFeaturesChange: (features: string[]) => void,
      maxFeatures: number,
      testIdPrefix: string,
    ) => {
      const selectedArch = options.find(a => a.name === selected);
      const archFeatures = (selectedArch?.features as string[]) || [];
      return (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-primary">{tier} Archetype</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {options.map(arch => (
              <Button
                key={arch.name}
                variant={selected === arch.name ? "default" : "outline"}
                className="text-xs justify-start"
                onClick={() => {
                  onSelect(arch.name);
                  const af = (arch.features as string[]) || [];
                  onFeaturesChange(af.slice(0, maxFeatures));
                }}
                data-testid={`${testIdPrefix}-${arch.name}`}
              >
                {arch.name}
              </Button>
            ))}
          </div>
          {selectedArch && archFeatures.length > 0 && (
            <div className="space-y-1.5 pl-2 border-l-2 border-primary/30">
              {archFeatures.map((feat, i) => (
                <label key={i} className="flex items-start gap-2 text-xs cursor-pointer">
                  <Checkbox
                    checked={features.includes(feat)}
                    disabled={i < maxFeatures}
                    onCheckedChange={(checked) => {
                      if (checked) onFeaturesChange([...features, feat]);
                      else onFeaturesChange(features.filter(f => f !== feat));
                    }}
                    data-testid={`${testIdPrefix}-feature-${i}`}
                  />
                  <span className="text-muted-foreground leading-tight">{feat}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">Choose your archetypes. Each tier grants unique abilities.</p>
        {needsInitiate && renderArchetypeSelector("Initiate", initiateArchetypes, selectedInitiate, setSelectedInitiate, initiateFeatures, setInitiateFeatures, 2, "btn-init")}
        {needsAcolyte && renderArchetypeSelector("Acolyte", acolyteArchetypes, selectedAcolyte, setSelectedAcolyte, acolyteFeatures, setAcolyteFeatures, acolyteFeatureSlots, "btn-aco")}
        {needsScholar && renderArchetypeSelector("Scholar", scholarArchetypes, selectedScholar, setSelectedScholar, scholarFeatures, setScholarFeatures, scholarFeatureSlots, "btn-sch")}
      </div>
    );
  };

  const renderSkills = () => {
    const skillCategories = ["Technique", "Relations", "Knowledge", "Awareness", "Physique", "Motorics"];
    const combatSkills = ["Melee Mastery", "Ranged Mastery", "Arcane Mastery"];
    const [expandedCat, setExpandedCat] = useState<string | null>(null);

    const availableGeneralFeats = allFeats?.filter(f =>
      !f.name.startsWith("COMBAT SKILL FEAT:") && !f.name.startsWith("ROLEPLAY SKILL FEAT:") && !f.name.startsWith("Martial Art:")
    ) || [];

    return (
      <div className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <Badge variant="outline">Skill Slots: {Object.keys(selectedSkills).length} / {totalSkillOpenings + totalSkillFeats + 6}</Badge>
          <Badge variant="outline">Feats: {selectedFeats.length} / {Math.max(1, totalFeatsCount + totalSkillFeats)}</Badge>
          <Badge variant="outline">Maneuvers: {selectedManeuvers.length} / {Math.max(2, totalManeuverCount)}</Badge>
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-primary">Combat Masteries</h4>
          <div className="grid grid-cols-3 gap-2">
            {combatSkills.map(s => (
              <div key={s} className="flex items-center justify-between bg-secondary/30 rounded px-2 py-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <Checkbox checked={!!selectedSkills[s]} onCheckedChange={() => toggleSkill(s)} data-testid={`check-skill-${s}`} />
                  {s}
                </label>
                {selectedSkills[s] && (
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => changeSkillTier(s, -1)} data-testid={`btn-tier-dec-${s}`}><Minus className="w-3 h-3" /></Button>
                    <span className="text-xs font-bold w-3 text-center">{selectedSkills[s]}</span>
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => changeSkillTier(s, 1)} data-testid={`btn-tier-inc-${s}`}><Plus className="w-3 h-3" /></Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {skillCategories.map(cat => {
          const catSkills = allSkills?.filter(s => s.category === cat) || [];
          if (catSkills.length === 0) return null;
          return (
            <Collapsible key={cat} open={expandedCat === cat} onOpenChange={(open) => setExpandedCat(open ? cat : null)}>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold py-1.5 hover-elevate rounded px-2" data-testid={`toggle-skill-cat-${cat}`}>
                <span>{cat} <span className="text-xs text-muted-foreground font-normal">({catSkills.filter(s => selectedSkills[s.name]).length} selected)</span></span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1">
                {catSkills.map(skill => (
                  <div key={skill.name} className="flex items-center justify-between bg-secondary/20 rounded px-2 py-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs flex-1">
                      <Checkbox checked={!!selectedSkills[skill.name]} onCheckedChange={() => toggleSkill(skill.name)} data-testid={`check-skill-${skill.name}`} />
                      <span>{skill.name}</span>
                      <span className="text-muted-foreground">({skill.stat})</span>
                    </label>
                    {selectedSkills[skill.name] && (
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => changeSkillTier(skill.name, -1)}><Minus className="w-3 h-3" /></Button>
                        <span className="text-xs font-bold w-3 text-center">{selectedSkills[skill.name]}</span>
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => changeSkillTier(skill.name, 1)}><Plus className="w-3 h-3" /></Button>
                      </div>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold py-1.5 hover-elevate rounded px-2" data-testid="toggle-feats-section">
            <span>Feats <span className="text-xs text-muted-foreground font-normal">({selectedFeats.length} selected)</span></span>
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

        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold py-1.5 hover-elevate rounded px-2" data-testid="toggle-maneuvers-section">
            <span>Maneuvers <span className="text-xs text-muted-foreground font-normal">({selectedManeuvers.length} selected)</span></span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pt-1 max-h-60 overflow-y-auto">
            {allManeuvers?.map(m => (
              <label key={m.name} className="flex items-start gap-2 text-xs cursor-pointer bg-secondary/20 rounded px-2 py-1.5">
                <Checkbox checked={selectedManeuvers.includes(m.name)} onCheckedChange={() => toggleManeuver(m.name)} className="mt-0.5" data-testid={`check-maneuver-${m.name}`} />
                <div>
                  <span className="font-semibold">{m.name}</span>
                  {m.effect && <p className="text-muted-foreground mt-0.5 leading-tight">{m.effect.slice(0, 100)}{m.effect.length > 100 ? "..." : ""}</p>}
                </div>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold py-1.5 hover-elevate rounded px-2" data-testid="toggle-languages-section">
            <span>Magick Languages <span className="text-xs text-muted-foreground font-normal">({selectedLanguages.length} selected)</span></span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pt-1">
            {allLanguages?.map(lang => (
              <label key={lang.name} className="flex items-center gap-2 text-xs cursor-pointer bg-secondary/20 rounded px-2 py-1.5">
                <Checkbox checked={selectedLanguages.includes(lang.name)} onCheckedChange={() => toggleLanguage(lang.name)} data-testid={`check-lang-${lang.name}`} />
                <span className="font-semibold">{lang.name}</span>
                <span className="text-muted-foreground">- {lang.domain}</span>
                <Badge variant="outline" className="text-[10px] ml-auto">Cost {lang.difficulty}</Badge>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  const renderEquipment = () => {
    const weaponTypes = ["Melee Weapon", "Projectile Weapon", "Blackpowder Weapon"];
    const [weaponTypeFilter, setWeaponTypeFilter] = useState(weaponTypes[0]);
    const filteredWeapons = allWeapons?.filter(w => w.type === weaponTypeFilter && w.dice && w.dice > 0) || [];

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
              {allArmor?.map(a => (
                <SelectItem key={a.name} value={a.name}>
                  {a.name} (Prot: {a.protection}, Evade: {a.evasionDice}D)
                </SelectItem>
              ))}
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
    const bodySum = (char.power ?? 0) + (char.finesse ?? 0) + (char.vitality ?? 0);
    const mindSum = (char.acumen ?? 0) + (char.diplomacy ?? 0) + (char.intuition ?? 0);
    const spiritSum = (char.talent ?? 0) + (char.moxie ?? 0) + (char.audacity ?? 0);

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
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} data-testid="button-next-step">
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

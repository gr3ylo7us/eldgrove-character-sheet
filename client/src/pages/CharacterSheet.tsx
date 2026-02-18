import { useCharacter, useUpdateCharacter } from "@/hooks/use-characters";
import { useDiceRoller } from "@/components/DiceRoller";
import type { RollOptions } from "@/components/DiceRoller";
import { RulesTooltip } from "@/components/RulesTooltip";
import { useParams, Link, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, Save, Swords, BookOpen, Shield, Scroll, Sparkles,
  Heart, Zap, Trash2, Plus, Eye, EyeOff, Target, Flame, Brain,
  Crown, Dices, Activity, Footprints, ChevronRight, Star, Wand2,
  BookMarked, Package, Feather, CircleDot, Crosshair, Languages
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useWeapons, useArmor, useSkills, useFeats, useManeuvers, useLanguages, useArchetypes } from "@/hooks/use-game-data";
import { STAT_LABELS, getReflexes, getSeek, getNerve, getHealth, getWill, getAptitude, getMove, getEvade, getSkulk, getSeeleMax, getWeaponAttack, getSpellCast, getWoundscaleThreshold } from "@/lib/formulas";
import type { Character } from "@shared/schema";

const STAT_ICONS: Record<string, any> = {
  power: Flame, finesse: Footprints, vitality: Heart,
  acumen: Brain, diplomacy: Crown, intuition: Eye,
  talent: Sparkles, moxie: Dices, audacity: Feather,
};

const BODY_STATS = ["power", "finesse", "vitality"] as const;
const MIND_STATS = ["acumen", "diplomacy", "intuition"] as const;
const SPIRIT_STATS = ["talent", "moxie", "audacity"] as const;

const WOUNDSCALE_STAGES = [
  { label: "Uninjured", max: 0, color: "bg-emerald-600" },
  { label: "Superficial", max: 5, color: "bg-emerald-500" },
  { label: "Light", max: 10, color: "bg-yellow-500" },
  { label: "Moderate", max: 15, color: "bg-amber-500" },
  { label: "Severe", max: 20, color: "bg-orange-500" },
  { label: "Critical", max: 25, color: "bg-red-500" },
  { label: "Mortal", max: 28, color: "bg-red-700" },
  { label: "Death's Door", max: 30, color: "bg-red-900" },
];

function StatBlock({ label, value, onChange, statKey, rollDice }: { label: string; value: number; onChange: (v: number) => void; statKey: string; rollDice?: (opts: RollOptions) => void }) {
  const Icon = STAT_ICONS[statKey] || Zap;
  return (
    <div className="flex flex-col items-center gap-1 p-3 bg-secondary/30 rounded border border-border/20">
      <Icon className="w-4 h-4 text-primary/70" />
      <RulesTooltip ruleKey={statKey}><span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</span></RulesTooltip>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" onClick={() => onChange(Math.max(0, value - 1))} data-testid={`button-dec-${label}`}>
          <span className="text-lg">-</span>
        </Button>
        <span className="text-2xl font-bold text-primary w-8 text-center" style={{ fontFamily: "var(--font-display)" }}>{value}</span>
        <Button size="icon" variant="ghost" onClick={() => onChange(value + 1)} data-testid={`button-inc-${label}`}>
          <span className="text-lg">+</span>
        </Button>
      </div>
      {rollDice && (
        <Button size="icon" variant="ghost" onClick={() => rollDice({ poolSize: value, label: `${label} Roll`, rollType: "stat" })} data-testid={`button-roll-stat-${statKey}`}>
          <Dices className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

function DerivedStat({ label, value, icon, ruleKey }: { label: string; value: number | string; icon?: any; ruleKey?: string }) {
  const Icon = icon;
  const labelEl = <span className="text-xs text-muted-foreground font-mono uppercase">{label}</span>;
  return (
    <div className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded border border-border/10">
      {Icon && <Icon className="w-3.5 h-3.5 text-primary/60 shrink-0" />}
      {ruleKey ? <RulesTooltip ruleKey={ruleKey}>{labelEl}</RulesTooltip> : labelEl}
      <span className="text-sm font-bold ml-auto">{value}</span>
    </div>
  );
}

function WoundBar({ wounds, maxWounds, onChange }: { wounds: number; maxWounds: number; onChange: (v: number) => void }) {
  const currentStage = getWoundscaleThreshold(wounds);
  const safeMax = Math.max(maxWounds, 1);
  const percentage = Math.min((wounds / safeMax) * 100, 100);

  const activeStage = WOUNDSCALE_STAGES.find((s, i) => {
    const next = WOUNDSCALE_STAGES[i + 1];
    if (!next) return true;
    return wounds <= s.max;
  }) || WOUNDSCALE_STAGES[WOUNDSCALE_STAGES.length - 1];

  return (
    <div className="space-y-2" data-testid="wound-bar">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-400" />
          <RulesTooltip ruleKey="woundscale"><span className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>Woundscale</span></RulesTooltip>
        </div>
        <Badge variant="outline" className="text-xs" data-testid="text-wound-stage">{currentStage}</Badge>
      </div>
      <div className="relative h-6 bg-secondary/60 rounded overflow-hidden border border-border/30">
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-300 ${activeStage.color}`}
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute inset-0 flex">
          {WOUNDSCALE_STAGES.slice(1).map((stage) => (
            <div
              key={stage.label}
              className="border-r border-background/30 h-full"
              style={{ width: `${((stage.max - (WOUNDSCALE_STAGES[WOUNDSCALE_STAGES.indexOf(stage) - 1]?.max || 0)) / safeMax) * 100}%` }}
              title={stage.label}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => onChange(Math.max(0, wounds - 1))} data-testid="button-wound-dec">
            <span className="text-lg">-</span>
          </Button>
          <Input
            type="number"
            className="w-16 text-center"
            value={wounds}
            onChange={e => onChange(Math.max(0, Math.min(safeMax, parseInt(e.target.value) || 0)))}
            data-testid="input-wounds"
          />
          <Button size="icon" variant="ghost" onClick={() => onChange(Math.min(safeMax, wounds + 1))} data-testid="button-wound-inc">
            <span className="text-lg">+</span>
          </Button>
        </div>
        <div className="flex gap-1">
          {WOUNDSCALE_STAGES.slice(1, -1).map((s) => (
            <div
              key={s.label}
              className={`w-2 h-2 rounded-full ${wounds > s.max ? 'opacity-100' : 'opacity-20'} ${s.color}`}
              title={s.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkulkTracker({ skulkMax, skulkCurrent, derivedSkulk, onMaxChange, onCurrentChange, onRollSkulk }: {
  skulkMax: number; skulkCurrent: number; derivedSkulk: number;
  onMaxChange: (v: number) => void; onCurrentChange: (v: number) => void;
  onRollSkulk: () => void;
}) {
  const pct = skulkMax > 0 ? Math.min((skulkCurrent / skulkMax) * 100, 100) : 0;
  let barColor = "bg-indigo-500";
  if (pct <= 25) barColor = "bg-red-500";
  else if (pct <= 50) barColor = "bg-amber-500";

  return (
    <div className="space-y-2" data-testid="skulk-tracker">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-indigo-400" />
          <RulesTooltip ruleKey="skulk"><span className="text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>Skulk</span></RulesTooltip>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Current</span>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => onCurrentChange(Math.max(0, skulkCurrent - 1))} data-testid="button-skulk-current-dec">
              <span>-</span>
            </Button>
            <Input type="number" className="w-14 text-center" value={skulkCurrent}
              onChange={e => onCurrentChange(Math.max(0, parseInt(e.target.value) || 0))}
              data-testid="input-skulk-current" />
            <Button size="icon" variant="ghost" onClick={() => onCurrentChange(skulkCurrent + 1)} data-testid="button-skulk-current-inc">
              <span>+</span>
            </Button>
          </div>
        </div>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-bold" data-testid="text-skulk-max">{skulkMax}</span>
        <Button variant="outline" onClick={onRollSkulk} data-testid="button-skulk-roll">
          <Dices className="w-3 h-3 mr-1" /> Roll Skulk ({derivedSkulk}D)
        </Button>
      </div>
      <div className="relative h-3 bg-secondary/60 rounded overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${barColor} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
        {skulkMax > 0 && (
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white mix-blend-difference">
            {skulkCurrent} / {skulkMax}
          </span>
        )}
      </div>
    </div>
  );
}

interface SelectedArchetype {
  name: string;
  tier: string;
  selectedFeatures: string[];
}

function SectionHeader({ icon: Icon, label, ruleKey }: { icon: any; label: string; ruleKey?: string }) {
  const labelEl = <h3 className="text-sm text-muted-foreground uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>{label}</h3>;
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-primary/70" />
      {ruleKey ? <RulesTooltip ruleKey={ruleKey}>{labelEl}</RulesTooltip> : labelEl}
    </div>
  );
}

export default function CharacterSheetPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");
  const { data: character, isLoading } = useCharacter(id);
  const updateMut = useUpdateCharacter(id);
  const { rollDice, onSkulkSpent } = useDiceRoller();
  const { data: allWeapons } = useWeapons();
  const { data: allArmor } = useArmor();
  const { data: allSkills } = useSkills();
  const { data: allFeats } = useFeats();
  const { data: allManeuvers } = useManeuvers();
  const { data: allLanguages } = useLanguages();
  const { data: allArchetypes } = useArchetypes();
  const [, navigate] = useLocation();

  const [form, setForm] = useState<Partial<Character>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (character) setForm({ ...character });
  }, [character]);

  const update = useCallback((key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  useEffect(() => {
    onSkulkSpent.current = (amount: number) => {
      setForm(prev => {
        const newCurrent = Math.max(0, (prev.skulkCurrent ?? 0) - amount);
        return { ...prev, skulkCurrent: newCurrent };
      });
      setDirty(true);
    };
    return () => { onSkulkSpent.current = null; };
  }, [onSkulkSpent]);

  const save = () => {
    const { id: _id, ...rest } = form;
    updateMut.mutate(rest as any, { onSuccess: () => setDirty(false) });
  };

  if (isLoading || !character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading character...</div>
      </div>
    );
  }

  const c = { ...character, ...form } as Character;
  const skillTiers = (c.skillTiers as Record<string, number>) || {};
  const equippedWeapons = (c.equippedWeapons as any[]) || [];
  const knownFeats = (c.knownFeats as string[]) || [];
  const knownManeuvers = (c.knownManeuvers as string[]) || [];
  const knownLangs = (c.knownLanguages as string[]) || [];
  const inventory = (c.inventory as any[]) || [];
  const selectedArchetypes = (c.selectedArchetypes as SelectedArchetype[]) || [];

  const MASTERY_SKILLS = ["Melee Mastery", "Ranged Mastery", "Arcane Mastery"];
  const addedSkillNames = Object.keys(skillTiers);
  const nonMasterySkillNames = addedSkillNames.filter(s => !MASTERY_SKILLS.includes(s));

  const addArchetype = (name: string) => {
    const arch = allArchetypes?.find(a => a.name === name);
    if (!arch || selectedArchetypes.some(sa => sa.name === name)) return;
    const features = (arch.features as string[]) || [];
    const newEntry: SelectedArchetype = { name: arch.name, tier: arch.tier || "", selectedFeatures: features };
    update("selectedArchetypes", [...selectedArchetypes, newEntry]);
  };

  const removeArchetype = (index: number) => {
    update("selectedArchetypes", selectedArchetypes.filter((_, i) => i !== index));
  };

  const toggleArchetypeFeature = (archIndex: number, feature: string) => {
    const updated = [...selectedArchetypes];
    const arch = updated[archIndex];
    if (arch.selectedFeatures.includes(feature)) {
      arch.selectedFeatures = arch.selectedFeatures.filter(f => f !== feature);
    } else {
      arch.selectedFeatures = [...arch.selectedFeatures, feature];
    }
    update("selectedArchetypes", updated);
  };

  const addSkill = (skillName: string) => {
    if (skillTiers[skillName] !== undefined) return;
    update("skillTiers", { ...skillTiers, [skillName]: 0 });
  };

  const removeSkill = (skillName: string) => {
    const newTiers = { ...skillTiers };
    delete newTiers[skillName];
    update("skillTiers", newTiers);
  };

  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <div>
              <Input
                className="text-2xl font-bold bg-transparent border-none p-0 h-auto text-primary"
                style={{ fontFamily: "var(--font-display)" }}
                value={form.name || ""}
                onChange={e => update("name", e.target.value)}
                data-testid="input-char-name"
              />
              <div className="flex items-center gap-2 mt-1">
                <Input className="text-sm bg-transparent border-none p-0 h-auto w-24 text-muted-foreground" value={form.race || ""} onChange={e => update("race", e.target.value)} placeholder="Race" data-testid="input-race" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-3.5 h-3.5 text-primary/60" />
              <RulesTooltip ruleKey="level"><span className="text-muted-foreground font-mono">LVL</span></RulesTooltip>
              <Button size="icon" variant="ghost" onClick={() => update("level", Math.max(1, (form.level ?? 1) - 1))} data-testid="button-level-dec">
                <span>-</span>
              </Button>
              <Input type="number" className="w-14 text-center" value={form.level ?? 1} onChange={e => update("level", parseInt(e.target.value) || 1)} data-testid="input-level" />
              <Button size="icon" variant="ghost" onClick={() => update("level", (form.level ?? 1) + 1)} data-testid="button-level-inc">
                <span>+</span>
              </Button>
            </div>
            <Link href={`/datacard/${id}`}>
              <Button variant="outline" data-testid="link-datacard"><Swords className="w-4 h-4 mr-2" /> Datacards</Button>
            </Link>
            {dirty && (
              <Button onClick={save} disabled={updateMut.isPending} data-testid="button-save">
                <Save className="w-4 h-4 mr-2" /> {updateMut.isPending ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="stats" className="space-y-4">
          <TabsList className="flex-wrap gap-1">
            <TabsTrigger value="stats" data-testid="tab-stats"><Zap className="w-3 h-3 mr-1" /> Stats</TabsTrigger>
            <TabsTrigger value="combat" data-testid="tab-combat"><Swords className="w-3 h-3 mr-1" /> Combat</TabsTrigger>
            <TabsTrigger value="skills" data-testid="tab-skills"><BookOpen className="w-3 h-3 mr-1" /> Skills</TabsTrigger>
            <TabsTrigger value="abilities" data-testid="tab-abilities"><Sparkles className="w-3 h-3 mr-1" /> Abilities</TabsTrigger>
            <TabsTrigger value="inventory" data-testid="tab-inventory"><Package className="w-3 h-3 mr-1" /> Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            <Card className="p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Body</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {BODY_STATS.map(key => (
                    <StatBlock key={key} statKey={key} label={STAT_LABELS[key]} value={(form as any)[key] ?? 1} onChange={v => update(key, v)} rollDice={rollDice} />
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Mind</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {MIND_STATS.map(key => (
                    <StatBlock key={key} statKey={key} label={STAT_LABELS[key]} value={(form as any)[key] ?? 1} onChange={v => update(key, v)} rollDice={rollDice} />
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Spirit</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {SPIRIT_STATS.map(key => (
                    <StatBlock key={key} statKey={key} label={STAT_LABELS[key]} value={(form as any)[key] ?? (key === "talent" ? 0 : 1)} onChange={v => update(key, v)} rollDice={rollDice} />
                  ))}
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <DerivedStat label="Reflexes" value={getReflexes(c)} icon={Zap} ruleKey="reflexes" />
              <DerivedStat label="Seek" value={getSeek(c)} icon={Crosshair} ruleKey="seek" />
              <DerivedStat label="Nerve" value={getNerve(c)} icon={Shield} ruleKey="nerve" />
              <DerivedStat label="Will" value={getWill(c)} icon={Brain} ruleKey="will" />
              <DerivedStat label="Move" value={`${getMove(c)}m`} icon={Footprints} ruleKey="move" />
              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded border border-border/10">
                <Shield className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                <RulesTooltip ruleKey="evade"><span className="text-xs text-muted-foreground font-mono uppercase">Evade</span></RulesTooltip>
                <span className="text-sm font-bold ml-auto">{getEvade(c)}</span>
                <Button size="icon" variant="ghost" onClick={() => rollDice({ poolSize: getEvade(c), label: "Evade Roll", rollType: "evade" })} data-testid="button-roll-evade">
                  <Dices className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5">
                <SectionHeader icon={Sparkles} label="Seele" ruleKey="seele" />
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={() => update("seeleCurrent", Math.max(0, (form.seeleCurrent ?? 0) - 1))} data-testid="button-seele-dec">
                    <span>-</span>
                  </Button>
                  <Input type="number" className="w-16 text-center" value={form.seeleCurrent ?? 0}
                    onChange={e => update("seeleCurrent", parseInt(e.target.value) || 0)} data-testid="input-seele-current" />
                  <Button size="icon" variant="ghost" onClick={() => update("seeleCurrent", (form.seeleCurrent ?? 0) + 1)} data-testid="button-seele-inc">
                    <span>+</span>
                  </Button>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-sm font-bold">{getSeeleMax(c)}</span>
                </div>
                {getSeeleMax(c) > 0 && (
                  <div className="relative h-2 bg-secondary/60 rounded overflow-hidden mt-2">
                    <div className="absolute inset-y-0 left-0 bg-violet-500 transition-all duration-300"
                      style={{ width: `${Math.min(((form.seeleCurrent ?? 0) / getSeeleMax(c)) * 100, 100)}%` }} />
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <SkulkTracker
                  skulkMax={form.skulkMax ?? 0}
                  skulkCurrent={form.skulkCurrent ?? 0}
                  derivedSkulk={getSkulk(c)}
                  onMaxChange={v => update("skulkMax", v)}
                  onCurrentChange={v => update("skulkCurrent", v)}
                  onRollSkulk={() => {
                    const result = rollDice({ poolSize: getSkulk(c), label: "Skulk Roll", rollType: "skulk" });
                    if (result) {
                      const total = Math.max(0, result.netSuccesses);
                      update("skulkMax", total);
                      update("skulkCurrent", total);
                    }
                  }}
                />
              </Card>
            </div>

            <Card className="p-5">
              <WoundBar wounds={form.woundsCurrent ?? 0} maxWounds={30} onChange={v => update("woundsCurrent", v)} />
            </Card>

            <Card className="p-5">
              <SectionHeader icon={CircleDot} label="Other Trackers" />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-3.5 h-3.5 text-primary/60" />
                  <RulesTooltip ruleKey="renown"><span className="text-xs text-muted-foreground">Renown</span></RulesTooltip>
                  <Button size="icon" variant="ghost" onClick={() => update("renown", Math.max(0, (form.renown ?? 0) - 1))} data-testid="button-renown-dec">
                    <span>-</span>
                  </Button>
                  <Input type="number" className="w-16 text-center" value={form.renown ?? 0} onChange={e => update("renown", parseInt(e.target.value) || 0)} data-testid="input-renown" />
                  <Button size="icon" variant="ghost" onClick={() => update("renown", (form.renown ?? 0) + 1)} data-testid="button-renown-inc">
                    <span>+</span>
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-primary/60" />
                  <RulesTooltip ruleKey="karma"><span className="text-xs text-muted-foreground">Karma</span></RulesTooltip>
                  <Button size="icon" variant="ghost" onClick={() => update("karma", Math.max(0, (form.karma ?? 0) - 1))} data-testid="button-karma-dec">
                    <span>-</span>
                  </Button>
                  <Input type="number" className="w-16 text-center" value={form.karma ?? 0} onChange={e => update("karma", parseInt(e.target.value) || 0)} data-testid="input-karma" />
                  <Button size="icon" variant="ghost" onClick={() => update("karma", (form.karma ?? 0) + 1)} data-testid="button-karma-inc">
                    <span>+</span>
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="combat" className="space-y-4">
            <Card className="p-5">
              <SectionHeader icon={Shield} label="Armor" />
              <Select value={form.armorName || ""} onValueChange={v => {
                const a = allArmor?.find(a => a.name === v);
                if (a) {
                  update("armorName", a.name);
                  update("armorProtection", a.protection);
                  update("armorEvasionDice", a.evasionDice);
                  update("armorEffects", a.effects);
                }
              }}>
                <SelectTrigger data-testid="select-armor"><SelectValue placeholder="Select armor" /></SelectTrigger>
                <SelectContent>
                  {allArmor?.map(a => <SelectItem key={a.id} value={a.name}>{a.name} (Prot: {a.protection}, Eva: {a.evasionDice})</SelectItem>)}
                </SelectContent>
              </Select>
              {form.armorName && (
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <Badge variant="secondary"><Shield className="w-3 h-3 mr-1" /> <RulesTooltip ruleKey="protection">Prot:</RulesTooltip> {form.armorProtection}</Badge>
                  <Badge variant="secondary"><Footprints className="w-3 h-3 mr-1" /> <RulesTooltip ruleKey="evasionDice">Eva Dice:</RulesTooltip> {form.armorEvasionDice}</Badge>
                  {form.armorEffects && <p className="text-xs text-muted-foreground italic mt-1 w-full">{form.armorEffects}</p>}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <SectionHeader icon={Swords} label="Weapons" />
                <Select onValueChange={v => {
                  const w = allWeapons?.find(w => w.name === v);
                  if (w) {
                    const wpns = [...equippedWeapons, { name: w.name, type: w.type, dice: w.dice, mastery: w.mastery, normalDamage: w.normalDamage, critDamage: w.critDamage, attacks: w.attacks, damageType: w.damageType, effects: w.effects }];
                    update("equippedWeapons", wpns);
                  }
                }}>
                  <SelectTrigger className="w-48" data-testid="select-add-weapon"><SelectValue placeholder="Add weapon..." /></SelectTrigger>
                  <SelectContent>
                    {allWeapons?.filter(w => w.type && ["Melee Weapon", "Blackpowder Weapon", "Projectile Weapon", "Explosive Weapon", "Natural Weapon"].includes(w.type)).map(w => <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {equippedWeapons.map((w: any, i: number) => (
                  <div key={i} className="flex items-start justify-between gap-2 p-3 bg-secondary/30 rounded border border-border/20" data-testid={`weapon-${i}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Swords className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        <span className="font-semibold text-sm">{w.name}</span>
                        <Badge variant="outline" className="text-xs">{w.type}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs"><Target className="w-3 h-3 mr-1" /> <RulesTooltip ruleKey="weaponAttack">ATK:</RulesTooltip> {getWeaponAttack(c, w)}</Badge>
                        <Badge variant="secondary" className="text-xs"><Flame className="w-3 h-3 mr-1" /> <RulesTooltip ruleKey="weaponDamage">DMG:</RulesTooltip> {w.normalDamage}/{w.critDamage}</Badge>
                        <Badge variant="secondary" className="text-xs">{w.damageType}</Badge>
                      </div>
                      {w.effects && <p className="text-xs text-muted-foreground/70 italic mt-2">{w.effects}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => rollDice({ poolSize: getWeaponAttack(c, w), label: `${w.name} Attack`, rollType: "weapon", effects: w.effects ? [w.effects] : [], damageInfo: { normalDamage: w.normalDamage, critDamage: w.critDamage, damageType: w.damageType }, isSilent: !!(w.effects && w.effects.toLowerCase().includes("silent")), skulkAvailable: form.skulkCurrent ?? 0 })} data-testid={`button-roll-weapon-${i}`}>
                        <Dices className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => {
                        update("equippedWeapons", equippedWeapons.filter((_: any, j: number) => j !== i));
                      }} data-testid={`button-remove-weapon-${i}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {equippedWeapons.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No weapons equipped. Add one above.</p>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <SectionHeader icon={Languages} label="Magick Languages (Combat)" />
                <Select onValueChange={v => { if (!knownLangs.includes(v)) update("knownLanguages", [...knownLangs, v]); }}>
                  <SelectTrigger className="w-48" data-testid="select-add-combat-lang"><SelectValue placeholder="Add language..." /></SelectTrigger>
                  <SelectContent>
                    {allLanguages?.filter(l => !knownLangs.includes(l.name)).map(l => <SelectItem key={l.id} value={l.name}>{l.name} ({l.domain})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {knownLangs.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No magical languages known. Add one above.</p>
                )}
                {knownLangs.map((lname, i) => {
                  const lang = allLanguages?.find(l => l.name === lname);
                  return (
                    <div key={i} className="p-3 bg-secondary/30 rounded border border-border/20" data-testid={`combat-lang-${i}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Wand2 className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                            <span className="font-semibold text-sm">{lname}</span>
                            {lang && <Badge variant="outline" className="text-xs">{lang.domain}</Badge>}
                          </div>
                          {lang && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs"><Target className="w-3 h-3 mr-1" /> <RulesTooltip ruleKey="spellCast">Cast:</RulesTooltip> {getSpellCast(c, lang)}</Badge>
                              <Badge variant="secondary" className="text-xs"><RulesTooltip ruleKey="spellCost">Cost:</RulesTooltip> {lang.difficulty}</Badge>
                              {lang.damage && <Badge variant="secondary" className="text-xs"><Flame className="w-3 h-3 mr-1" /> DMG: {lang.damage}</Badge>}
                            </div>
                          )}
                          {lang?.tags && <div className="flex flex-wrap gap-1 mt-2">{(lang.tags as string).split(",").map((t, ti) => <Badge key={ti} variant="outline" className="text-[10px]">{t.trim()}</Badge>)}</div>}
                          {lang?.commands && <p className="text-xs text-muted-foreground mt-2"><span className="font-medium">Commands:</span> {lang.commands}</p>}
                          {lang?.effect && <p className="text-xs text-muted-foreground/70 italic mt-1">{lang.effect}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {lang && (
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={(c.seeleCurrent ?? 0) < (lang.difficulty ?? 0)}
                              onClick={() => {
                                update("seeleCurrent", (c.seeleCurrent ?? 0) - (lang.difficulty || 0));
                                const hasSilent = !!(lang.tags && lang.tags.toLowerCase().includes("silent"));
                                rollDice({ poolSize: getSpellCast(c, lang), label: `Cast ${lname}`, rollType: "spell", effects: lang.tags ? [lang.tags] : [], damageInfo: lang.damage ? { languageDamage: lang.damage } : undefined, isSilent: hasSilent, skulkAvailable: form.skulkCurrent ?? 0 });
                              }}
                              data-testid={`button-roll-spell-${lname}`}
                              className={(c.seeleCurrent ?? 0) < (lang.difficulty ?? 0) ? "text-destructive" : ""}
                            >
                              <Dices className="w-3 h-3" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => update("knownLanguages", knownLangs.filter((_, j) => j !== i))} data-testid={`button-remove-combat-lang-${i}`}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <SectionHeader icon={Swords} label="Masteries" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                {MASTERY_SKILLS.map(mName => {
                  const tier = skillTiers[mName] ?? 0;
                  const hasMastery = tier > 0;
                  const mIcon = mName === "Melee Mastery" ? Swords : mName === "Ranged Mastery" ? Crosshair : Wand2;
                  const MIcon = mIcon;
                  return (
                    <div key={mName} className={`flex flex-col items-center gap-2 p-3 rounded border ${hasMastery ? "bg-primary/10 border-primary/30" : "bg-secondary/20 border-border/10"}`} data-testid={`mastery-${mName}`}>
                      <MIcon className={`w-5 h-5 ${hasMastery ? "text-primary" : "text-muted-foreground/40"}`} />
                      <span className="text-xs font-semibold text-center" style={{ fontFamily: "var(--font-display)" }}>{mName}</span>
                      <Button
                        size="sm"
                        variant={hasMastery ? "default" : "outline"}
                        className="toggle-elevate"
                        onClick={() => {
                          if (hasMastery) {
                            const t = { ...skillTiers };
                            delete t[mName];
                            update("skillTiers", t);
                          } else {
                            update("skillTiers", { ...skillTiers, [mName]: 1 });
                          }
                        }}
                        data-testid={`button-toggle-mastery-${mName}`}
                      >
                        {hasMastery ? "Trained" : "Untrained"}
                      </Button>
                      {hasMastery && (
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => {
                            const t = { ...skillTiers, [mName]: Math.max(1, tier - 1) };
                            update("skillTiers", t);
                          }}>
                            <span>-</span>
                          </Button>
                          <span className="w-6 text-center text-sm font-bold text-primary">{tier}</span>
                          <Button size="icon" variant="ghost" onClick={() => {
                            const t = { ...skillTiers, [mName]: tier + 1 };
                            update("skillTiers", t);
                          }}>
                            <span>+</span>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => rollDice({ poolSize: tier, label: `${mName} Check`, rollType: "skill" })} data-testid={`button-roll-skill-${mName}`}>
                            <Dices className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground/60 italic text-center mb-4">Trained masteries allow exceeding the action limit for their respective attack type per turn.</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <SectionHeader icon={BookOpen} label="Skills" ruleKey="skills" />
                <Select onValueChange={addSkill} data-testid="select-add-skill">
                  <SelectTrigger className="w-52" data-testid="select-add-skill-trigger">
                    <SelectValue placeholder="Add skill..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allSkills?.filter(s => !addedSkillNames.includes(s.name) && !MASTERY_SKILLS.includes(s.name)).map(s => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name} ({s.stat})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {nonMasterySkillNames.length === 0 && (
                  <p className="text-xs text-muted-foreground italic col-span-2 text-center py-6">No skills added yet. Use the dropdown above to add skills your character has trained.</p>
                )}
                {nonMasterySkillNames.map(sName => {
                  const tier = skillTiers[sName] ?? 0;
                  const skillData = allSkills?.find(s => s.name === sName);
                  return (
                    <div key={sName} className="flex items-center justify-between gap-2 p-2.5 rounded bg-secondary/20 border border-border/10" data-testid={`skill-${sName}`}>
                      <div className="min-w-0 flex items-center gap-2">
                        <BookMarked className="w-3.5 h-3.5 text-primary/50 shrink-0" />
                        <div>
                          <span className="text-sm font-medium">{sName}</span>
                          {skillData && <span className="text-xs text-muted-foreground ml-1.5">({skillData.stat})</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => {
                          const t = { ...skillTiers, [sName]: Math.max(0, tier - 1) };
                          update("skillTiers", t);
                        }}>
                          <span>-</span>
                        </Button>
                        <span className="w-6 text-center text-sm font-bold text-primary">{tier}</span>
                        <Button size="icon" variant="ghost" onClick={() => {
                          const t = { ...skillTiers, [sName]: tier + 1 };
                          update("skillTiers", t);
                        }}>
                          <span>+</span>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => rollDice({ poolSize: tier, label: `${sName} Check`, rollType: "skill" })} data-testid={`button-roll-skill-${sName}`}>
                          <Dices className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => removeSkill(sName)} data-testid={`button-remove-skill-${sName}`}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="abilities" className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <SectionHeader icon={Crown} label="Archetypes" ruleKey="archetypes" />
                <Select onValueChange={addArchetype} data-testid="select-add-archetype">
                  <SelectTrigger className="w-52" data-testid="select-add-archetype-trigger">
                    <SelectValue placeholder="Add archetype..." />
                  </SelectTrigger>
                  <SelectContent>
                    {["Initiate", "Acolyte", "Scholar"].map(tier => {
                      const tierArchetypes = allArchetypes?.filter(a => a.tier === tier && !selectedArchetypes.some(sa => sa.name === a.name)) || [];
                      if (tierArchetypes.length === 0) return null;
                      return (
                        <SelectGroup key={tier}>
                          <SelectLabel className="text-xs font-semibold text-primary/70 uppercase tracking-wider">{tier}</SelectLabel>
                          {tierArchetypes.map(a => (
                            <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                          ))}
                        </SelectGroup>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {selectedArchetypes.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-4">No archetypes selected. This is a classless system — add as many archetypes as you qualify for.</p>
              )}
              <div className="space-y-3">
                {selectedArchetypes.map((sa, archIdx) => {
                  const archData = allArchetypes?.find(a => a.name === sa.name);
                  const allFeatures = (archData?.features as string[]) || [];
                  return (
                    <div key={archIdx} className="p-4 bg-secondary/20 rounded border border-border/20" data-testid={`archetype-entry-${archIdx}`}>
                      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-primary" />
                          <span className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>{sa.name}</span>
                          <Badge variant="outline" className="text-xs">{sa.tier}</Badge>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => removeArchetype(archIdx)} data-testid={`button-remove-archetype-${archIdx}`}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {allFeatures.map((feature, fIdx) => {
                          const isSelected = sa.selectedFeatures.includes(feature);
                          const featureName = feature.split(":")[0];
                          return (
                            <div key={fIdx} className={`flex items-start gap-3 p-2.5 rounded transition-colors ${isSelected ? 'bg-primary/5 border border-primary/20' : 'bg-secondary/10 border border-transparent'}`}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleArchetypeFeature(archIdx, feature)}
                                className="mt-0.5 shrink-0"
                                data-testid={`checkbox-feature-${archIdx}-${fIdx}`}
                              />
                              <div className="min-w-0">
                                <span className="text-sm font-semibold text-primary/90">{featureName}</span>
                                {feature.includes(":") && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{feature.substring(feature.indexOf(":") + 1).trim()}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <SectionHeader icon={Feather} label="Feats" ruleKey="feats" />
                <Select onValueChange={v => { if (!knownFeats.includes(v)) update("knownFeats", [...knownFeats, v]); }}>
                  <SelectTrigger className="w-48" data-testid="select-add-feat"><SelectValue placeholder="Add feat..." /></SelectTrigger>
                  <SelectContent>
                    {allFeats?.filter(f => !knownFeats.includes(f.name)).map(f => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {knownFeats.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No feats learned yet.</p>
                )}
                {knownFeats.map((fname, i) => {
                  const feat = allFeats?.find(f => f.name === fname);
                  return (
                    <div key={i} className="p-3 bg-secondary/20 rounded border border-border/10 flex justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Feather className="w-3.5 h-3.5 text-primary/50 shrink-0" />
                          <span className="text-sm font-semibold">{fname}</span>
                          {feat?.featType && <Badge variant="outline" className="text-xs">{feat.featType}</Badge>}
                        </div>
                        {feat && <p className="text-xs text-muted-foreground mt-1">{feat.effect}</p>}
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => update("knownFeats", knownFeats.filter((_, j) => j !== i))}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <SectionHeader icon={Target} label="Maneuvers" ruleKey="maneuvers" />
                <Select onValueChange={v => { if (!knownManeuvers.includes(v)) update("knownManeuvers", [...knownManeuvers, v]); }}>
                  <SelectTrigger className="w-48" data-testid="select-add-maneuver"><SelectValue placeholder="Add maneuver..." /></SelectTrigger>
                  <SelectContent>
                    {allManeuvers?.filter(m => !knownManeuvers.includes(m.name)).map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {knownManeuvers.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No maneuvers learned yet.</p>
                )}
                {knownManeuvers.map((mname, i) => {
                  const man = allManeuvers?.find(m => m.name === mname);
                  return (
                    <div key={i} className="p-3 bg-secondary/20 rounded border border-border/10 flex justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Target className="w-3.5 h-3.5 text-primary/50 shrink-0" />
                          <span className="text-sm font-semibold">{mname}</span>
                          {man && <Badge variant="secondary" className="text-xs"><Sparkles className="w-3 h-3 mr-1" /> {man.seeleCost} Seele</Badge>}
                        </div>
                        {man && <p className="text-xs text-muted-foreground mt-1">{man.effect}</p>}
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => update("knownManeuvers", knownManeuvers.filter((_, j) => j !== i))}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>

          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card className="p-5">
              <SectionHeader icon={Package} label="Inventory" />
              <div className="space-y-2">
                {inventory.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2.5 bg-secondary/20 rounded border border-border/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="w-3.5 h-3.5 text-primary/50 shrink-0" />
                      <div>
                        <span className="text-sm font-semibold">{item.name}</span>
                        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => update("inventory", inventory.filter((_: any, j: number) => j !== i))}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {inventory.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">Inventory is empty.</p>
                )}
                <div className="flex gap-2 mt-3">
                  <Input id="new-item-name" placeholder="Item name" className="flex-1" data-testid="input-new-item" />
                  <Button variant="outline" onClick={() => {
                    const inp = document.getElementById("new-item-name") as HTMLInputElement;
                    if (inp.value.trim()) {
                      update("inventory", [...inventory, { name: inp.value.trim(), description: "" }]);
                      inp.value = "";
                    }
                  }} data-testid="button-add-item"><Plus className="w-3 h-3 mr-1" /> Add</Button>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <SectionHeader icon={Scroll} label="Notes" />
              <Textarea value={form.notes || ""} onChange={e => update("notes", e.target.value)} placeholder="Character notes..." className="min-h-[100px]" data-testid="textarea-notes" />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

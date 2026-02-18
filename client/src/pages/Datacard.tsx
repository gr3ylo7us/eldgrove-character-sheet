import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "wouter";
import { useCharacter, useUpdateCharacter } from "@/hooks/use-characters";
import { useLanguages, useFeats, useManeuvers, useSkills } from "@/hooks/use-game-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Swords, BookOpen, Shield, Heart, Zap, Sparkles, Minus, Plus, Activity, Wand2, Languages, Dices, ChevronDown, BookMarked, Crown, Star, Crosshair, Feather, EyeOff } from "lucide-react";
import { STAT_LABELS, getReflexes, getSeek, getNerve, getHealth, getWill, getAptitude, getMove, getEvade, getSkulk, getSeeleMax, getWeaponAttack, getSpellCast, getWoundscaleThreshold } from "@/lib/formulas";
import type { Character } from "@shared/schema";
import { RulesTooltip } from "@/components/RulesTooltip";
import { useDiceRoller } from "@/components/DiceRoller";
import type { RollOptions } from "@/components/DiceRoller";

function ResourceTracker({ label, testId, current, max, onChange, icon }: { label: React.ReactNode; testId?: string; current: number; max: number; onChange: (v: number) => void; icon?: any }) {
  const Icon = icon;
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const color = pct > 60 ? "bg-primary" : pct > 30 ? "bg-yellow-600" : "bg-destructive";
  const tid = testId ?? "resource";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-primary/70" />}
          <span className="text-xs font-mono uppercase text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => onChange(Math.max(0, current - 1))} data-testid={`button-dec-${tid}`}>
            <Minus className="w-3 h-3" />
          </Button>
          <span className="text-sm font-bold w-10 text-center">{current}/{max}</span>
          <Button size="icon" variant="ghost" onClick={() => onChange(Math.min(max, current + 1))} data-testid={`button-inc-${tid}`}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-300 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

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

function DatacardWoundBar({ wounds, onChange }: { wounds: number; onChange: (v: number) => void }) {
  const maxWounds = 30;
  const safeMax = Math.max(maxWounds, 1);
  const [localWounds, setLocalWounds] = useState(wounds);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setLocalWounds(wounds);
  }, [wounds, editing]);

  const displayWounds = editing ? localWounds : wounds;
  const currentStage = getWoundscaleThreshold(displayWounds);
  const percentage = Math.min((displayWounds / safeMax) * 100, 100);

  const activeStage = WOUNDSCALE_STAGES.find((s, i) => {
    const next = WOUNDSCALE_STAGES[i + 1];
    if (!next) return true;
    return displayWounds <= s.max;
  }) || WOUNDSCALE_STAGES[WOUNDSCALE_STAGES.length - 1];

  const commitValue = (v: number) => {
    const clamped = Math.max(0, Math.min(maxWounds, v));
    setLocalWounds(clamped);
    setEditing(false);
    onChange(clamped);
  };

  return (
    <div className="space-y-2" data-testid="datacard-wound-bar">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-400" />
          <RulesTooltip ruleKey="woundscale"><span className="text-xs font-mono text-muted-foreground uppercase">Woundscale</span></RulesTooltip>
        </div>
        <Badge variant="outline" className="text-xs" data-testid="datacard-wound-stage">{currentStage}</Badge>
      </div>
      <div className="relative h-5 bg-secondary/60 rounded overflow-hidden border border-border/30">
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
          <Button size="icon" variant="ghost" onClick={() => commitValue(displayWounds - 1)} data-testid="button-datacard-wound-dec">
            <Minus className="w-3 h-3" />
          </Button>
          <Input
            type="number"
            className="w-14 text-center"
            value={displayWounds}
            onFocus={() => setEditing(true)}
            onChange={e => {
              const v = Math.max(0, Math.min(maxWounds, parseInt(e.target.value) || 0));
              setLocalWounds(v);
            }}
            onBlur={() => commitValue(localWounds)}
            onKeyDown={e => { if (e.key === "Enter") commitValue(localWounds); }}
            data-testid="input-datacard-wounds"
          />
          <Button size="icon" variant="ghost" onClick={() => commitValue(displayWounds + 1)} data-testid="button-datacard-wound-inc">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex gap-1">
          {WOUNDSCALE_STAGES.slice(1, -1).map((s) => (
            <div
              key={s.label}
              className={`w-2 h-2 rounded-full ${displayWounds > s.max ? 'opacity-100' : 'opacity-20'} ${s.color}`}
              title={s.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, icon, defaultOpen = true, children, testId }: { title: string; icon: any; defaultOpen?: boolean; children: React.ReactNode; testId?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = icon;
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="p-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex items-center justify-between w-full -mx-1 -mt-1 mb-1" data-testid={testId}>
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-primary/70" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{title}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {children}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

const STAT_GROUPS = [
  { keys: ["power", "finesse", "vitality"] as const, label: "Body", color: "text-red-400" },
  { keys: ["acumen", "diplomacy", "intuition"] as const, label: "Mind", color: "text-blue-400" },
  { keys: ["talent", "moxie", "audacity"] as const, label: "Spirit", color: "text-violet-400" },
];

function StatGrid({ character, rollDice }: { character: Character; rollDice: (opts: RollOptions) => void }) {
  const c = character;
  return (
    <div className="grid grid-cols-3 gap-3">
      {STAT_GROUPS.map(group => (
        <div key={group.label}>
          <div className={`text-[9px] font-mono ${group.color} uppercase text-center mb-1`}>{group.label}</div>
          <div className="grid grid-cols-3 gap-1">
            {group.keys.map(key => {
              const val = (c as any)[key] ?? (key === "talent" ? 0 : 1);
              return (
                <div key={key} className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase"><RulesTooltip ruleKey={key}>{STAT_LABELS[key]}</RulesTooltip></span>
                  <div className="text-xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>{val}</div>
                  <Button size="icon" variant="ghost" onClick={() => rollDice({ poolSize: val, label: `${STAT_LABELS[key]} Roll`, rollType: "stat" })} data-testid={`button-roll-stat-${key}`}>
                    <Dices className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function DerivedStatsRow({ character, rollDice }: { character: Character; rollDice: (opts: RollOptions) => void }) {
  const c = character;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
      <Card className="p-2 flex flex-col items-center">
        <span className="text-[10px] text-muted-foreground font-mono"><RulesTooltip ruleKey="evade">EVADE</RulesTooltip></span>
        <div className="text-lg font-bold">{getEvade(c)}</div>
        <Button size="icon" variant="ghost" onClick={() => rollDice({ poolSize: getEvade(c), label: "Evade Roll", rollType: "evade" })} data-testid="button-roll-evade">
          <Dices className="w-3 h-3" />
        </Button>
      </Card>
      <Card className="p-2"><span className="text-[10px] text-muted-foreground font-mono"><RulesTooltip ruleKey="protection">PROT</RulesTooltip></span><div className="text-lg font-bold">{c.armorProtection ?? 0}</div></Card>
      <Card className="p-2"><span className="text-[10px] text-muted-foreground font-mono"><RulesTooltip ruleKey="move">MOVE</RulesTooltip></span><div className="text-lg font-bold">{getMove(c)}"</div></Card>
      <Card className="p-2"><span className="text-[10px] text-muted-foreground font-mono"><RulesTooltip ruleKey="nerve">NERVE</RulesTooltip></span><div className="text-lg font-bold">{getNerve(c)}</div></Card>
      <Card className="p-2"><span className="text-[10px] text-muted-foreground font-mono"><RulesTooltip ruleKey="reflexes">REFL</RulesTooltip></span><div className="text-lg font-bold">{getReflexes(c)}</div></Card>
      <Card className="p-2"><span className="text-[10px] text-muted-foreground font-mono"><RulesTooltip ruleKey="seek">SEEK</RulesTooltip></span><div className="text-lg font-bold">{getSeek(c)}</div></Card>
      <Card className="p-2"><span className="text-[10px] text-muted-foreground font-mono"><RulesTooltip ruleKey="will">WILL</RulesTooltip></span><div className="text-lg font-bold">{getWill(c)}</div></Card>
      <Card className="p-2"><span className="text-[10px] text-muted-foreground font-mono"><RulesTooltip ruleKey="skulk">SKULK</RulesTooltip></span><div className="text-lg font-bold">{c.skulkCurrent ?? 0}/{c.skulkMax ?? 0}</div></Card>
    </div>
  );
}

function SkillsSection({ character, rollDice }: { character: Character; rollDice: (opts: RollOptions) => void }) {
  const skillTiers = (character.skillTiers as Record<string, number>) || {};
  const nonZeroSkills = Object.entries(skillTiers).filter(([_, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const { data: allSkills } = useSkills();

  if (nonZeroSkills.length === 0) {
    return <p className="text-xs text-muted-foreground italic text-center py-2">No trained skills.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-1">
      {nonZeroSkills.map(([name, tier]) => {
        const skillData = allSkills?.find(s => s.name === name);
        return (
          <div key={name} className="flex items-center justify-between px-2 py-1 bg-secondary/20 rounded text-sm" data-testid={`dc-skill-${name}`}>
            <div className="flex items-center gap-1 min-w-0">
              <BookMarked className="w-3 h-3 text-primary/40 shrink-0" />
              <span className="truncate">{name}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="font-bold text-primary text-xs">{tier}</span>
              <Button size="icon" variant="ghost" onClick={() => rollDice({ poolSize: tier, label: `${name} Check`, rollType: "skill" })} data-testid={`button-roll-skill-${name}`}>
                <Dices className="w-3 h-3" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SkulkBar({ character, onUpdate, rollDice }: { character: Character; onUpdate: (key: string, value: any) => void; rollDice: (opts: RollOptions) => any }) {
  const c = character;
  const skulkMax = c.skulkMax ?? 0;
  const skulkCurrent = c.skulkCurrent ?? 0;
  const derivedSkulk = getSkulk(c);
  const pct = skulkMax > 0 ? Math.min((skulkCurrent / skulkMax) * 100, 100) : 0;
  let barColor = "bg-indigo-500";
  if (pct <= 25) barColor = "bg-red-500";
  else if (pct <= 50) barColor = "bg-amber-500";

  return (
    <div className="space-y-2" data-testid="dc-skulk-bar">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Current</span>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => onUpdate("skulkCurrent", Math.max(0, skulkCurrent - 1))} data-testid="button-dc-skulk-dec">
              <Minus className="w-3 h-3" />
            </Button>
            <span className="text-lg font-bold text-indigo-400 w-8 text-center" data-testid="text-dc-skulk-current">{skulkCurrent}</span>
            <Button size="icon" variant="ghost" onClick={() => onUpdate("skulkCurrent", skulkCurrent + 1)} data-testid="button-dc-skulk-inc">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-bold" data-testid="text-dc-skulk-max">{skulkMax}</span>
        </div>
        <Button variant="outline" onClick={() => {
          const result = rollDice({ poolSize: derivedSkulk, label: "Skulk Roll", rollType: "skulk" });
          if (result) {
            const total = Math.max(0, result.netSuccesses);
            onUpdate("skulkMax", total);
            onUpdate("skulkCurrent", total);
          }
        }} data-testid="button-dc-skulk-roll">
          <Dices className="w-3 h-3 mr-1" /> Roll ({derivedSkulk}D)
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

function CombatDatacard({ character, onUpdate }: { character: Character; onUpdate: (key: string, value: any) => void }) {
  const c = character;
  const equippedWeapons = (c.equippedWeapons as any[]) || [];
  const knownManeuvers = (c.knownManeuvers as string[]) || [];
  const knownLangs = (c.knownLanguages as string[]) || [];
  const knownFeats = (c.knownFeats as string[]) || [];
  const { data: allManeuvers } = useManeuvers();
  const { data: allLanguages } = useLanguages();
  const { data: allFeats } = useFeats();
  const { rollDice } = useDiceRoller();
  const seeleMax = getSeeleMax(c);

  return (
    <div className="space-y-3">
      <StatGrid character={c} rollDice={rollDice} />
      <DerivedStatsRow character={c} rollDice={rollDice} />

      <ResourceTracker label={<RulesTooltip ruleKey="seele">Seele</RulesTooltip>} testId="seele" current={c.seeleCurrent ?? 0} max={seeleMax} onChange={v => onUpdate("seeleCurrent", v)} icon={Sparkles} />
      <DatacardWoundBar wounds={c.woundsCurrent ?? 0} onChange={v => onUpdate("woundsCurrent", v)} />

      <CollapsibleSection title="Skulk" icon={EyeOff} testId="section-combat-skulk">
        <SkulkBar character={c} onUpdate={onUpdate} rollDice={rollDice} />
      </CollapsibleSection>

      <CollapsibleSection title="Weapons" icon={Swords} testId="section-weapons">
        <div className="space-y-2">
          {equippedWeapons.map((w: any, i: number) => {
            const hasSilent = !!(w.effects && w.effects.toLowerCase().includes("silent"));
            return (
              <div key={i} className="flex items-center justify-between gap-2 p-2 bg-secondary/20 rounded" data-testid={`combat-weapon-${i}`}>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold">{w.name}</span>
                    {hasSilent && <Badge variant="outline" className="text-[10px] border-indigo-500/50 text-indigo-400"><EyeOff className="w-2.5 h-2.5 mr-0.5" />Silent</Badge>}
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                    <span><RulesTooltip ruleKey="weaponAttack">ATK:</RulesTooltip> {getWeaponAttack(c, w)}</span>
                    <span><RulesTooltip ruleKey="weaponDamage">DMG:</RulesTooltip> {w.normalDamage}/{w.critDamage}</span>
                    <span>{w.damageType}</span>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => rollDice({ poolSize: getWeaponAttack(c, w), label: `${w.name} Attack`, rollType: "weapon", effects: w.effects ? [w.effects] : [], damageInfo: { normalDamage: w.normalDamage, critDamage: w.critDamage, damageType: w.damageType }, isSilent: hasSilent, skulkAvailable: c.skulkCurrent ?? 0 })} data-testid={`button-roll-weapon-${i}`}>
                  <Dices className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
          {equippedWeapons.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-2">No weapons equipped.</p>}
        </div>
      </CollapsibleSection>

      {knownLangs.length > 0 && (
        <CollapsibleSection title="Magick Languages" icon={Languages} testId="section-languages">
          <div className="space-y-2">
            {knownLangs.map((lname, i) => {
              const lang = allLanguages?.find(l => l.name === lname);
              if (!lang) return null;
              return (
                <div key={i} className="p-2.5 bg-secondary/20 rounded" data-testid={`combat-lang-${i}`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-3.5 h-3.5 text-primary/50 shrink-0" />
                      <span className="text-sm font-semibold">{lname}</span>
                      <Badge variant="outline" className="text-xs">{lang.domain}</Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-xs"><RulesTooltip ruleKey="spellCast">Cast:</RulesTooltip> {getSpellCast(c, lang)}</Badge>
                      <Badge variant="secondary" className="text-xs"><RulesTooltip ruleKey="spellCost">Cost:</RulesTooltip> {lang.difficulty}</Badge>
                      {lang.damage && <Badge variant="secondary" className="text-xs"><RulesTooltip ruleKey="weaponDamage">DMG:</RulesTooltip> {lang.damage}</Badge>}
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={(c.seeleCurrent ?? 0) < (lang.difficulty ?? 0)}
                        onClick={() => {
                          onUpdate("seeleCurrent", (c.seeleCurrent ?? 0) - (lang.difficulty || 0));
                          const hasSilent = !!(lang.tags && lang.tags.toLowerCase().includes("silent"));
                          rollDice({ poolSize: getSpellCast(c, lang), label: `Cast ${lname}`, rollType: "spell", effects: lang.tags ? [lang.tags] : [], damageInfo: lang.damage ? { languageDamage: lang.damage } : undefined, isSilent: hasSilent, skulkAvailable: c.skulkCurrent ?? 0 });
                        }}
                        data-testid={`button-roll-spell-${lname}`}
                        className={(c.seeleCurrent ?? 0) < (lang.difficulty ?? 0) ? "text-destructive" : ""}
                      >
                        <Dices className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {lang.tags && <div className="flex flex-wrap gap-1 mt-1.5">{(lang.tags as string).split(",").map((t, ti) => <Badge key={ti} variant="outline" className="text-[10px]">{t.trim()}</Badge>)}</div>}
                  {lang.commands && <p className="text-xs text-muted-foreground mt-1.5"><span className="font-medium">Commands:</span> {lang.commands}</p>}
                  {lang.effect && <p className="text-xs text-muted-foreground/70 italic mt-1">{lang.effect}</p>}
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Skills" icon={BookOpen} defaultOpen={false} testId="section-combat-skills">
        <SkillsSection character={c} rollDice={rollDice} />
      </CollapsibleSection>

      {knownManeuvers.length > 0 && (
        <CollapsibleSection title="Maneuvers" icon={Crosshair} testId="section-maneuvers">
          <div className="space-y-1">
            {knownManeuvers.map((mname, i) => {
              const man = allManeuvers?.find(m => m.name === mname);
              return (
                <div key={i} className="flex items-start justify-between gap-2 p-2 bg-secondary/20 rounded text-sm" data-testid={`combat-maneuver-${i}`}>
                  <div>
                    <span className="font-semibold">{mname}</span>
                    {man && <p className="text-xs text-muted-foreground mt-0.5">{man.effect}</p>}
                  </div>
                  {man && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded shrink-0"><RulesTooltip ruleKey="maneuvers">{man.seeleCost}</RulesTooltip></span>}
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {knownFeats.length > 0 && (
        <CollapsibleSection title="Feats" icon={Star} testId="section-combat-feats">
          <div className="space-y-1">
            {knownFeats.map((fname, i) => {
              const feat = allFeats?.find(f => f.name === fname);
              return (
                <div key={i} className="px-2 py-1.5 bg-secondary/20 rounded text-sm" data-testid={`combat-feat-${i}`}>
                  <span className="font-semibold">{fname}</span>
                  {feat && <p className="text-xs text-muted-foreground mt-0.5">{feat.effect}</p>}
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {c.armorName && (
        <div className="text-center text-xs text-muted-foreground italic border-t border-border/30 pt-2">
          {c.armorName}: {c.armorEffects}
        </div>
      )}
    </div>
  );
}

function RoleplayDatacard({ character, onUpdate }: { character: Character; onUpdate: (key: string, value: any) => void }) {
  const c = character;
  const knownLangs = (c.knownLanguages as string[]) || [];
  const knownFeats = (c.knownFeats as string[]) || [];
  const selectedArchetypes = (c.selectedArchetypes as any[]) || [];
  const archetypeFeatures = selectedArchetypes.flatMap((sa: any) => (sa.selectedFeatures || []) as string[]);
  const { data: allLanguages } = useLanguages();
  const { data: allFeats } = useFeats();
  const { rollDice } = useDiceRoller();
  const seeleMax = getSeeleMax(c);

  return (
    <div className="space-y-3">
      <StatGrid character={c} rollDice={rollDice} />
      <DerivedStatsRow character={c} rollDice={rollDice} />

      <div className="grid grid-cols-2 gap-3">
        <ResourceTracker label={<RulesTooltip ruleKey="seele">Seele</RulesTooltip>} testId="seele" current={c.seeleCurrent ?? 0} max={seeleMax} onChange={v => onUpdate("seeleCurrent", v)} icon={Sparkles} />
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-muted-foreground uppercase"><RulesTooltip ruleKey="renown">Renown</RulesTooltip> / <RulesTooltip ruleKey="karma">Karma</RulesTooltip></span>
            <span className="text-sm font-bold">{c.renown} / {c.karma}</span>
          </div>
        </div>
      </div>

      <CollapsibleSection title="Skulk" icon={EyeOff} testId="section-rp-skulk">
        <SkulkBar character={c} onUpdate={onUpdate} rollDice={rollDice} />
      </CollapsibleSection>

      <CollapsibleSection title="Skills" icon={BookOpen} testId="section-rp-skills">
        <SkillsSection character={c} rollDice={rollDice} />
      </CollapsibleSection>

      {knownLangs.length > 0 && (
        <CollapsibleSection title="Magick Languages" icon={Languages} testId="section-rp-languages">
          <div className="space-y-1">
            {knownLangs.map((lname, i) => {
              const lang = allLanguages?.find(l => l.name === lname);
              return (
                <div key={i} className="flex items-center justify-between px-2 py-1 bg-secondary/20 rounded text-sm" data-testid={`rp-lang-${i}`}>
                  <div>
                    <span className="font-semibold">{lname}</span>
                    {lang && <span className="text-xs text-muted-foreground ml-2">({lang.domain})</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    {lang && <span className="text-xs font-mono"><RulesTooltip ruleKey="spellCast">Cast:</RulesTooltip> {getSpellCast(c, lang)}</span>}
                    {lang && (
                      <Button size="icon" variant="ghost" onClick={() => {
                        const hasSilent = !!(lang.tags && lang.tags.toLowerCase().includes("silent"));
                        rollDice({ poolSize: getSpellCast(c, lang), label: `Cast ${lname}`, rollType: "spell", effects: lang.tags ? [lang.tags] : [], damageInfo: lang.damage ? { languageDamage: lang.damage } : undefined, isSilent: hasSilent, skulkAvailable: c.skulkCurrent ?? 0 });
                      }} data-testid={`button-roll-spell-${lname}`}>
                        <Dices className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {knownFeats.length > 0 && (
        <CollapsibleSection title="Feats" icon={Star} testId="section-rp-feats">
          <div className="space-y-1">
            {knownFeats.map((fname, i) => {
              const feat = allFeats?.find(f => f.name === fname);
              return (
                <div key={i} className="px-2 py-1.5 bg-secondary/20 rounded text-sm" data-testid={`rp-feat-${i}`}>
                  <span className="font-semibold">{fname}</span>
                  {feat && <p className="text-xs text-muted-foreground mt-0.5">{feat.effect}</p>}
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {archetypeFeatures.length > 0 && (
        <CollapsibleSection title="Archetype Features" icon={Crown} testId="section-rp-archetypes">
          <div className="space-y-1">
            {archetypeFeatures.map((feat: string, i: number) => (
              <p key={i} className="text-sm text-muted-foreground px-2 py-1 bg-secondary/20 rounded">{feat}</p>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

export default function DatacardPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");
  const { data: character, isLoading } = useCharacter(id);
  const updateMut = useUpdateCharacter(id);
  const { onSkulkSpent } = useDiceRoller();

  const handleUpdate = useCallback((key: string, value: any) => {
    updateMut.mutate({ [key]: value });
  }, [updateMut]);

  useEffect(() => {
    onSkulkSpent.current = (amount: number) => {
      if (!character) return;
      const newCurrent = Math.max(0, (character.skulkCurrent ?? 0) - amount);
      updateMut.mutate({ skulkCurrent: newCurrent });
    };
    return () => { onSkulkSpent.current = null; };
  }, [onSkulkSpent, character, updateMut]);

  if (isLoading || !character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading datacard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={`/character/${id}`}>
              <Button variant="ghost" size="icon" data-testid="button-back-to-sheet"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <div>
              <h1 className="text-xl text-primary" style={{ fontFamily: "var(--font-display)" }}>{character.name}</h1>
              <p className="text-xs text-muted-foreground italic">{character.race} {((character.selectedArchetypes as any[]) || []).map((a: any) => a.name).join(", ") || character.archetype || ""} - LVL {character.level}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="combat" className="space-y-4">
          <TabsList>
            <TabsTrigger value="combat" data-testid="tab-combat-card"><Swords className="w-3 h-3 mr-1" /> Combat</TabsTrigger>
            <TabsTrigger value="roleplay" data-testid="tab-roleplay-card"><BookOpen className="w-3 h-3 mr-1" /> Roleplay</TabsTrigger>
          </TabsList>
          <TabsContent value="combat">
            <CombatDatacard character={character} onUpdate={handleUpdate} />
          </TabsContent>
          <TabsContent value="roleplay">
            <RoleplayDatacard character={character} onUpdate={handleUpdate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

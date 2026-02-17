import { useCharacter, useUpdateCharacter } from "@/hooks/use-characters";
import { useParams, Link, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Swords, BookOpen, Shield, Scroll, Sparkles, Heart, Zap, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useWeapons, useArmor, useSkills, useFeats, useManeuvers, useLanguages } from "@/hooks/use-game-data";
import { STAT_LABELS, getReflexes, getSeek, getNerve, getHealth, getWill, getAptitude, getMove, getEvade, getSkulk, getSeeleMax, getWeaponAttack, getWoundscaleThreshold } from "@/lib/formulas";
import type { Character } from "@shared/schema";

function StatBlock({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" onClick={() => onChange(Math.max(0, value - 1))} data-testid={`button-dec-${label}`}>
          <span className="text-lg">-</span>
        </Button>
        <span className="text-2xl font-bold text-primary w-8 text-center" style={{ fontFamily: "var(--font-display)" }}>{value}</span>
        <Button size="icon" variant="ghost" onClick={() => onChange(value + 1)} data-testid={`button-inc-${label}`}>
          <span className="text-lg">+</span>
        </Button>
      </div>
    </div>
  );
}

function DerivedStat({ label, value, icon }: { label: string; value: number | string; icon?: any }) {
  const Icon = icon;
  return (
    <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded">
      {Icon && <Icon className="w-3.5 h-3.5 text-primary/60" />}
      <span className="text-xs text-muted-foreground font-mono uppercase">{label}</span>
      <span className="text-sm font-bold ml-auto">{value}</span>
    </div>
  );
}

export default function CharacterSheetPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0");
  const { data: character, isLoading } = useCharacter(id);
  const updateMut = useUpdateCharacter(id);
  const { data: allWeapons } = useWeapons();
  const { data: allArmor } = useArmor();
  const { data: allSkills } = useSkills();
  const { data: allFeats } = useFeats();
  const { data: allManeuvers } = useManeuvers();
  const { data: allLanguages } = useLanguages();
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
                <Input className="text-sm bg-transparent border-none p-0 h-auto w-32 text-muted-foreground" value={form.archetype || ""} onChange={e => update("archetype", e.target.value)} placeholder="Archetype" data-testid="input-archetype" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground font-mono">LVL</span>
              <Input type="number" className="w-14 text-center" value={form.level ?? 1} onChange={e => update("level", parseInt(e.target.value) || 1)} data-testid="input-level" />
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
            <TabsTrigger value="inventory" data-testid="tab-inventory"><Scroll className="w-3 h-3 mr-1" /> Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            <Card className="p-5">
              <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-display)" }}>Core Stats</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {Object.entries(STAT_LABELS).map(([key, label]) => (
                  <StatBlock key={key} label={label} value={(form as any)[key] ?? 1} onChange={v => update(key, v)} />
                ))}
              </div>
            </Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <DerivedStat label="Reflexes" value={getReflexes(c)} icon={Zap} />
              <DerivedStat label="Seek" value={getSeek(c)} />
              <DerivedStat label="Nerve" value={getNerve(c)} icon={Heart} />
              <DerivedStat label="Health" value={getHealth(c)} icon={Heart} />
              <DerivedStat label="Will" value={getWill(c)} />
              <DerivedStat label="Aptitude" value={getAptitude(c)} />
              <DerivedStat label="Move" value={`${getMove(c)}"`} />
              <DerivedStat label="Evade" value={getEvade(c)} icon={Shield} />
              <DerivedStat label="Skulk" value={getSkulk(c)} />
              <DerivedStat label="Seele Max" value={getSeeleMax(c)} icon={Sparkles} />
            </div>
            <Card className="p-5">
              <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-display)" }}>Condition</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Seele</label>
                  <div className="flex items-center gap-1">
                    <Input type="number" className="w-16" value={form.seeleCurrent ?? 0} onChange={e => update("seeleCurrent", parseInt(e.target.value) || 0)} data-testid="input-seele-current" />
                    <span className="text-muted-foreground">/</span>
                    <span className="text-sm">{getSeeleMax(c)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Wounds</label>
                  <Input type="number" className="w-16" value={form.woundsCurrent ?? 0} onChange={e => update("woundsCurrent", parseInt(e.target.value) || 0)} data-testid="input-wounds" />
                  <span className="text-xs text-muted-foreground">{getWoundscaleThreshold(c.woundsCurrent ?? 0)}</span>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Renown</label>
                  <Input type="number" className="w-16" value={form.renown ?? 0} onChange={e => update("renown", parseInt(e.target.value) || 0)} data-testid="input-renown" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Karma</label>
                  <Input type="number" className="w-16" value={form.karma ?? 0} onChange={e => update("karma", parseInt(e.target.value) || 0)} data-testid="input-karma" />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="combat" className="space-y-4">
            <Card className="p-5">
              <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-display)" }}>Armor</h3>
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
                <div className="mt-2 text-sm text-muted-foreground">
                  <span className="font-mono">Protection: {form.armorProtection} | Evasion Dice: {form.armorEvasionDice}</span>
                  <p className="mt-1 italic text-xs">{form.armorEffects}</p>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className="text-sm text-muted-foreground uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>Weapons</h3>
                <Select onValueChange={v => {
                  const w = allWeapons?.find(w => w.name === v);
                  if (w) {
                    const wpns = [...equippedWeapons, { name: w.name, type: w.type, dice: w.dice, mastery: w.mastery, normalDamage: w.normalDamage, critDamage: w.critDamage, attacks: w.attacks, damageType: w.damageType, effects: w.effects }];
                    update("equippedWeapons", wpns);
                  }
                }}>
                  <SelectTrigger className="w-48" data-testid="select-add-weapon"><SelectValue placeholder="Add weapon..." /></SelectTrigger>
                  <SelectContent>
                    {allWeapons?.map(w => <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {equippedWeapons.map((w: any, i: number) => (
                  <div key={i} className="flex items-start justify-between gap-2 p-3 bg-secondary/30 rounded border border-border/20" data-testid={`weapon-${i}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{w.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{w.type}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                        <span>ATK: {getWeaponAttack(c, w)}</span>
                        <span>DMG: {w.normalDamage}/{w.critDamage}</span>
                        <span>{w.damageType}</span>
                      </div>
                      {w.effects && <p className="text-xs text-muted-foreground/70 italic mt-1">{w.effects}</p>}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => {
                      update("equippedWeapons", equippedWeapons.filter((_: any, j: number) => j !== i));
                    }} data-testid={`button-remove-weapon-${i}`}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <Card className="p-5">
              <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-display)" }}>Skill Tiers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {allSkills?.map(s => {
                  const tier = skillTiers[s.name] ?? 0;
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-2 p-2 rounded bg-secondary/20 border border-border/10" data-testid={`skill-${s.name}`}>
                      <div className="min-w-0">
                        <span className="text-sm">{s.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{s.stat} / {s.category}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => {
                          const t = { ...skillTiers, [s.name]: Math.max(0, tier - 1) };
                          update("skillTiers", t);
                        }}>
                          <span>-</span>
                        </Button>
                        <span className="w-6 text-center text-sm font-bold">{tier}</span>
                        <Button size="icon" variant="ghost" onClick={() => {
                          const t = { ...skillTiers, [s.name]: tier + 1 };
                          update("skillTiers", t);
                        }}>
                          <span>+</span>
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
              <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className="text-sm text-muted-foreground uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>Feats</h3>
                <Select onValueChange={v => { if (!knownFeats.includes(v)) update("knownFeats", [...knownFeats, v]); }}>
                  <SelectTrigger className="w-48" data-testid="select-add-feat"><SelectValue placeholder="Add feat..." /></SelectTrigger>
                  <SelectContent>
                    {allFeats?.filter(f => !knownFeats.includes(f.name)).map(f => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {knownFeats.map((fname, i) => {
                  const feat = allFeats?.find(f => f.name === fname);
                  return (
                    <div key={i} className="p-2 bg-secondary/20 rounded border border-border/10 flex justify-between gap-2">
                      <div>
                        <span className="text-sm font-semibold">{fname}</span>
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
              <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className="text-sm text-muted-foreground uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>Maneuvers</h3>
                <Select onValueChange={v => { if (!knownManeuvers.includes(v)) update("knownManeuvers", [...knownManeuvers, v]); }}>
                  <SelectTrigger className="w-48" data-testid="select-add-maneuver"><SelectValue placeholder="Add maneuver..." /></SelectTrigger>
                  <SelectContent>
                    {allManeuvers?.filter(m => !knownManeuvers.includes(m.name)).map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {knownManeuvers.map((mname, i) => {
                  const man = allManeuvers?.find(m => m.name === mname);
                  return (
                    <div key={i} className="p-2 bg-secondary/20 rounded border border-border/10 flex justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{mname}</span>
                          {man && <span className="text-xs bg-primary/20 text-primary px-1.5 rounded">{man.seeleCost} Seele</span>}
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

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className="text-sm text-muted-foreground uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>Known Languages (Magick)</h3>
                <Select onValueChange={v => { if (!knownLangs.includes(v)) update("knownLanguages", [...knownLangs, v]); }}>
                  <SelectTrigger className="w-48" data-testid="select-add-lang"><SelectValue placeholder="Add language..." /></SelectTrigger>
                  <SelectContent>
                    {allLanguages?.filter(l => !knownLangs.includes(l.name)).map(l => <SelectItem key={l.id} value={l.name}>{l.name} ({l.domain})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {knownLangs.map((lname, i) => {
                  const lang = allLanguages?.find(l => l.name === lname);
                  return (
                    <div key={i} className="p-2 bg-secondary/20 rounded border border-border/10 flex justify-between gap-2">
                      <div>
                        <span className="text-sm font-semibold">{lname}</span>
                        {lang && <span className="text-xs text-muted-foreground ml-2">({lang.domain}) Diff: {lang.difficulty}</span>}
                        {lang && <p className="text-xs text-muted-foreground mt-1">{lang.effect}</p>}
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => update("knownLanguages", knownLangs.filter((_, j) => j !== i))}>
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
              <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-display)" }}>Inventory</h3>
              <div className="space-y-2">
                {inventory.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2 bg-secondary/20 rounded border border-border/10">
                    <div>
                      <span className="text-sm font-semibold">{item.name}</span>
                      {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => update("inventory", inventory.filter((_: any, j: number) => j !== i))}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2 mt-3">
                  <Input id="new-item-name" placeholder="Item name" className="flex-1" data-testid="input-new-item" />
                  <Button variant="outline" onClick={() => {
                    const inp = document.getElementById("new-item-name") as HTMLInputElement;
                    if (inp.value.trim()) {
                      update("inventory", [...inventory, { name: inp.value.trim(), description: "" }]);
                      inp.value = "";
                    }
                  }} data-testid="button-add-item">Add</Button>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-display)" }}>Notes</h3>
              <Textarea value={form.notes || ""} onChange={e => update("notes", e.target.value)} placeholder="Character notes..." className="min-h-[100px]" data-testid="textarea-notes" />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

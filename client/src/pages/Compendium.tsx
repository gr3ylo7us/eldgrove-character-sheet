import { Link } from "wouter";
import { useWeapons, useArmor, useItems, useSkills, useFeats, useManeuvers, useLanguages, useLeveling } from "@/hooks/use-game-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Swords, Shield, Package, BookOpen, Sparkles, Star, Scroll, GraduationCap } from "lucide-react";
import { useState } from "react";

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <Input placeholder="Search..." value={value} onChange={e => onChange(e.target.value)} className="mb-4" data-testid="input-compendium-search" />;
}

export default function CompendiumPage() {
  const { data: weapons } = useWeapons();
  const { data: armorList } = useArmor();
  const { data: itemsList } = useItems();
  const { data: skillsList } = useSkills();
  const { data: featsList } = useFeats();
  const { data: maneuversList } = useManeuvers();
  const { data: langList } = useLanguages();
  const { data: levelList } = useLeveling();
  const [search, setSearch] = useState("");

  const filter = <T extends Record<string, any>>(items: T[] | undefined, keys: string[]): T[] => {
    if (!items) return [];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(item => keys.some(k => String(item[k] || "").toLowerCase().includes(q)));
  };

  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back-compendium"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="text-2xl md:text-3xl text-primary" style={{ fontFamily: "var(--font-display)" }}>Compendium</h1>
        </div>

        <Tabs defaultValue="weapons" className="space-y-4">
          <TabsList className="flex-wrap gap-1">
            <TabsTrigger value="weapons" data-testid="comp-tab-weapons"><Swords className="w-3 h-3 mr-1" /> Weapons</TabsTrigger>
            <TabsTrigger value="armor" data-testid="comp-tab-armor"><Shield className="w-3 h-3 mr-1" /> Armor</TabsTrigger>
            <TabsTrigger value="items" data-testid="comp-tab-items"><Package className="w-3 h-3 mr-1" /> Items</TabsTrigger>
            <TabsTrigger value="skills" data-testid="comp-tab-skills"><BookOpen className="w-3 h-3 mr-1" /> Skills</TabsTrigger>
            <TabsTrigger value="feats" data-testid="comp-tab-feats"><Star className="w-3 h-3 mr-1" /> Feats</TabsTrigger>
            <TabsTrigger value="maneuvers" data-testid="comp-tab-maneuvers"><Sparkles className="w-3 h-3 mr-1" /> Maneuvers</TabsTrigger>
            <TabsTrigger value="languages" data-testid="comp-tab-languages"><Scroll className="w-3 h-3 mr-1" /> Languages</TabsTrigger>
            <TabsTrigger value="leveling" data-testid="comp-tab-leveling"><GraduationCap className="w-3 h-3 mr-1" /> Leveling</TabsTrigger>
          </TabsList>

          <TabsContent value="weapons">
            <SearchInput value={search} onChange={setSearch} />
            <div className="space-y-2">
              {filter(weapons, ["name", "type", "damageType", "effects"]).map(w => (
                <Card key={w.id} className="p-4" data-testid={`comp-weapon-${w.id}`}>
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <div>
                      <span className="font-semibold">{w.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{w.type}</span>
                    </div>
                    <div className="flex gap-3 text-xs font-mono text-muted-foreground">
                      <span>Dice: {w.dice}</span>
                      <span>DMG: {w.normalDamage}/{w.critDamage}</span>
                      <span>ATK: {w.attacks}</span>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{w.damageType} | Mastery: {w.mastery}</div>
                  {w.effects && <p className="mt-1 text-xs text-muted-foreground/80 italic">{w.effects}</p>}
                  {w.keyword && <p className="mt-1 text-xs"><span className="text-primary">{w.keyword}:</span> {w.keywordEffect}</p>}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="armor">
            <SearchInput value={search} onChange={setSearch} />
            <div className="space-y-2">
              {filter(armorList, ["name", "effects"]).map(a => (
                <Card key={a.id} className="p-4" data-testid={`comp-armor-${a.id}`}>
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-semibold">{a.name}</span>
                    <div className="flex gap-3 text-xs font-mono text-muted-foreground">
                      <span>Prot: {a.protection}</span>
                      <span>Eva Dice: {a.evasionDice}</span>
                    </div>
                  </div>
                  {a.effects && <p className="mt-1 text-xs text-muted-foreground italic">{a.effects}</p>}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="items">
            <SearchInput value={search} onChange={setSearch} />
            <div className="space-y-2">
              {filter(itemsList, ["name", "bonuses", "description", "category"]).map(it => (
                <Card key={it.id} className="p-4" data-testid={`comp-item-${it.id}`}>
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-semibold">{it.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">{it.category} R{it.rarity}</span>
                  </div>
                  {it.bonuses && <p className="mt-1 text-xs text-muted-foreground">{it.bonuses}</p>}
                  {it.description && <p className="mt-1 text-xs text-muted-foreground/80 italic">{it.description}</p>}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="skills">
            <SearchInput value={search} onChange={setSearch} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filter(skillsList, ["name", "stat", "category", "overview"]).map(s => (
                <Card key={s.id} className="p-4" data-testid={`comp-skill-${s.id}`}>
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">{s.stat} / {s.category}</span>
                  </div>
                  {s.overview && <p className="mt-1 text-xs text-muted-foreground/80">{s.overview}</p>}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="feats">
            <SearchInput value={search} onChange={setSearch} />
            <div className="space-y-2">
              {filter(featsList, ["name", "effect", "featType"]).map(f => (
                <Card key={f.id} className="p-4" data-testid={`comp-feat-${f.id}`}>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold">{f.name}</span>
                    {f.featType && <span className="text-xs font-mono text-muted-foreground shrink-0">{f.featType}</span>}
                  </div>
                  {f.effect && <p className="mt-1 text-xs text-muted-foreground">{f.effect}</p>}
                  {f.prerequisites && <p className="mt-1 text-xs text-primary/60">Prereq: {f.prerequisites}</p>}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="maneuvers">
            <SearchInput value={search} onChange={setSearch} />
            <div className="space-y-2">
              {filter(maneuversList, ["name", "effect"]).map(m => (
                <Card key={m.id} className="p-4" data-testid={`comp-maneuver-${m.id}`}>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold">{m.name}</span>
                    {m.seeleCost && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded shrink-0">{m.seeleCost} Seele</span>}
                  </div>
                  {m.effect && <p className="mt-1 text-xs text-muted-foreground">{m.effect}</p>}
                  {m.prerequisite && <p className="mt-1 text-xs text-primary/60">Prereq: {m.prerequisite}</p>}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="languages">
            <SearchInput value={search} onChange={setSearch} />
            <div className="space-y-2">
              {filter(langList, ["name", "domain", "effect", "commands"]).map(l => (
                <Card key={l.id} className="p-4" data-testid={`comp-lang-${l.id}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-semibold">{l.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({l.domain})</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">Diff: {l.difficulty}</span>
                  </div>
                  {l.effect && <p className="mt-1 text-xs text-muted-foreground">{l.effect}</p>}
                  {l.commands && <p className="mt-1 text-xs text-primary/60">Commands: {l.commands}</p>}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leveling">
            <div className="space-y-2">
              {levelList?.map(l => (
                <Card key={l.id} className="p-4" data-testid={`comp-level-${l.id}`}>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-primary" style={{ fontFamily: "var(--font-display)" }}>Level {l.level}</span>
                  </div>
                  {l.bonuses && <p className="mt-1 text-sm text-muted-foreground">{l.bonuses}</p>}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

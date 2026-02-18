import { Link } from "wouter";
import { useWeapons, useArmor, useItems, useSkills, useFeats, useManeuvers, useLanguages, useLeveling, useArchetypes } from "@/hooks/use-game-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Swords, Shield, Package, BookOpen, Sparkles, Star, Scroll, GraduationCap, Users, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Weapon, Armor, Item, Skill, Feat, Maneuver, Language, LevelingEntry, Archetype } from "@shared/schema";

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <Input placeholder="Search..." value={value} onChange={e => onChange(e.target.value)} className="mb-4" data-testid="input-compendium-search" />;
}

type DetailItem =
  | { type: "weapon"; data: Weapon }
  | { type: "armor"; data: Armor }
  | { type: "item"; data: Item }
  | { type: "skill"; data: Skill }
  | { type: "feat"; data: Feat }
  | { type: "maneuver"; data: Maneuver }
  | { type: "language"; data: Language }
  | { type: "archetype"; data: Archetype }
  | { type: "leveling"; data: LevelingEntry }
  | null;

function DetailDialog({ item, onClose }: { item: DetailItem; onClose: () => void }) {
  if (!item) return null;

  return (
    <Dialog open={!!item} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary" style={{ fontFamily: "var(--font-display)" }}>
            {item.type === "leveling" ? `Level ${item.data.level}` : item.data.name}
          </DialogTitle>
        </DialogHeader>

        {item.type === "weapon" && <WeaponDetail data={item.data} />}
        {item.type === "armor" && <ArmorDetail data={item.data} />}
        {item.type === "item" && <ItemDetail data={item.data} />}
        {item.type === "skill" && <SkillDetail data={item.data} />}
        {item.type === "feat" && <FeatDetail data={item.data} />}
        {item.type === "maneuver" && <ManeuverDetail data={item.data} />}
        {item.type === "language" && <LanguageDetail data={item.data} />}
        {item.type === "archetype" && <ArchetypeDetail data={item.data} />}
        {item.type === "leveling" && <LevelingDetail data={item.data} />}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function WeaponDetail({ data }: { data: Weapon }) {
  return (
    <div className="space-y-1" data-testid="detail-weapon">
      <InfoRow label="Type" value={data.type} />
      <InfoRow label="Dice" value={data.dice} />
      <InfoRow label="Mastery" value={data.mastery} />
      <InfoRow label="Normal DMG" value={data.normalDamage} />
      <InfoRow label="Crit DMG" value={data.critDamage} />
      <InfoRow label="Attacks" value={data.attacks} />
      <InfoRow label="Damage Type" value={data.damageType} />
      <InfoRow label="Slot" value={data.occupiedSlot} />
      <InfoRow label="Effects" value={data.effects} />
      <InfoRow label="Upgrade" value={data.upgradeEffects} />
      {data.keyword && (
        <div className="mt-3 p-3 bg-primary/10 rounded">
          <span className="text-sm font-semibold text-primary">{data.keyword}</span>
          <p className="text-sm mt-1">{data.keywordEffect}</p>
        </div>
      )}
    </div>
  );
}

function ArmorDetail({ data }: { data: Armor }) {
  return (
    <div className="space-y-1" data-testid="detail-armor">
      <InfoRow label="Protection" value={data.protection} />
      <InfoRow label="Evasion Dice" value={data.evasionDice} />
      <InfoRow label="Effects" value={data.effects} />
    </div>
  );
}

function ItemDetail({ data }: { data: Item }) {
  return (
    <div className="space-y-1" data-testid="detail-item">
      <InfoRow label="Category" value={data.category} />
      <InfoRow label="Rarity" value={data.rarity} />
      <InfoRow label="Bonuses" value={data.bonuses} />
      <InfoRow label="Description" value={data.description} />
      <InfoRow label="Effects" value={data.effects} />
      <InfoRow label="Usage Dice" value={data.usageDice} />
    </div>
  );
}

function SkillDetail({ data }: { data: Skill }) {
  return (
    <div className="space-y-1" data-testid="detail-skill">
      <InfoRow label="Stat" value={data.stat} />
      <InfoRow label="Category" value={data.category} />
      <InfoRow label="Spirit Stat" value={data.spiritStat} />
      {data.overview && (
        <div className="mt-3 p-3 bg-secondary/30 rounded">
          <p className="text-sm">{data.overview}</p>
        </div>
      )}
    </div>
  );
}

function FeatDetail({ data }: { data: Feat }) {
  return (
    <div className="space-y-1" data-testid="detail-feat">
      <InfoRow label="Type" value={data.featType} />
      <InfoRow label="Prerequisites" value={data.prerequisites} />
      {data.effect && (
        <div className="mt-3 p-3 bg-secondary/30 rounded">
          <p className="text-sm">{data.effect}</p>
        </div>
      )}
    </div>
  );
}

function ManeuverDetail({ data }: { data: Maneuver }) {
  return (
    <div className="space-y-1" data-testid="detail-maneuver">
      <InfoRow label="Seele Cost" value={data.seeleCost} />
      <InfoRow label="Prerequisite" value={data.prerequisite} />
      {data.effect && (
        <div className="mt-3 p-3 bg-secondary/30 rounded">
          <p className="text-sm">{data.effect}</p>
        </div>
      )}
    </div>
  );
}

function LanguageDetail({ data }: { data: Language }) {
  return (
    <div className="space-y-1" data-testid="detail-language">
      <InfoRow label="Domain" value={data.domain} />
      <InfoRow label="Cost" value={data.difficulty} />
      <InfoRow label="Damage" value={data.damage} />
      <InfoRow label="Tags" value={data.tags} />
      <InfoRow label="Commands" value={data.commands} />
      {data.effect && (
        <div className="mt-3 p-3 bg-secondary/30 rounded">
          <p className="text-sm">{data.effect}</p>
        </div>
      )}
    </div>
  );
}

function ArchetypeDetail({ data }: { data: Archetype }) {
  const features = (data.features as string[]) || [];
  return (
    <div className="space-y-3" data-testid="detail-archetype">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{data.tier}</Badge>
      </div>
      {features.length > 0 && (
        <div className="space-y-2 mt-3">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Features</span>
          {features.map((f, i) => (
            <div key={i} className="p-3 bg-secondary/30 rounded">
              <p className="text-sm">{f}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LevelingDetail({ data }: { data: LevelingEntry }) {
  return (
    <div className="space-y-1" data-testid="detail-leveling">
      <InfoRow label="Level" value={data.level} />
      {data.bonuses && (
        <div className="mt-3 p-3 bg-secondary/30 rounded">
          <p className="text-sm">{data.bonuses}</p>
        </div>
      )}
    </div>
  );
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
  const { data: archList } = useArchetypes();
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<DetailItem>(null);

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
            <TabsTrigger value="archetypes" data-testid="comp-tab-archetypes"><Users className="w-3 h-3 mr-1" /> Archetypes</TabsTrigger>
            <TabsTrigger value="leveling" data-testid="comp-tab-leveling"><GraduationCap className="w-3 h-3 mr-1" /> Leveling</TabsTrigger>
          </TabsList>

          <TabsContent value="weapons">
            <SearchInput value={search} onChange={setSearch} />
            <div className="space-y-2">
              {filter(weapons, ["name", "type", "damageType", "effects"]).map(w => (
                <Card key={w.id} className="p-4 cursor-pointer hover-elevate" onClick={() => setDetail({ type: "weapon", data: w })} data-testid={`comp-weapon-${w.id}`}>
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{w.name}</span>
                      <span className="text-xs text-muted-foreground">{w.type}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                    </div>
                    <div className="flex gap-3 text-xs font-mono text-muted-foreground">
                      <span>Dice: {w.dice}</span>
                      <span>DMG: {w.normalDamage}/{w.critDamage}</span>
                      <span>ATK: {w.attacks}</span>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{w.damageType} | Mastery: {w.mastery}</div>
                  {w.effects && <p className="mt-1 text-xs text-muted-foreground/80 italic">{w.effects}</p>}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="armor">
            <SearchInput value={search} onChange={setSearch} />
            <div className="space-y-2">
              {filter(armorList, ["name", "effects"]).map(a => (
                <Card key={a.id} className="p-4 cursor-pointer hover-elevate" onClick={() => setDetail({ type: "armor", data: a })} data-testid={`comp-armor-${a.id}`}>
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{a.name}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                    </div>
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
                <Card key={it.id} className="p-4 cursor-pointer hover-elevate" onClick={() => setDetail({ type: "item", data: it })} data-testid={`comp-item-${it.id}`}>
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{it.name}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                    </div>
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
                <Card key={s.id} className="p-4 cursor-pointer hover-elevate" onClick={() => setDetail({ type: "skill", data: s })} data-testid={`comp-skill-${s.id}`}>
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{s.name}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{s.stat} / {s.category}</span>
                  </div>
                  {s.overview && <p className="mt-1 text-xs text-muted-foreground/80 line-clamp-2">{s.overview}</p>}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="feats">
            <SearchInput value={search} onChange={setSearch} />
            <div className="space-y-2">
              {filter(featsList, ["name", "effect", "featType"]).map(f => (
                <Card key={f.id} className="p-4 cursor-pointer hover-elevate" onClick={() => setDetail({ type: "feat", data: f })} data-testid={`comp-feat-${f.id}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{f.name}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                    </div>
                    {f.featType && <Badge variant="secondary" className="shrink-0">{f.featType}</Badge>}
                  </div>
                  {f.effect && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{f.effect}</p>}
                  {f.prerequisites && <p className="mt-1 text-xs text-primary/60">Prereq: {f.prerequisites}</p>}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="maneuvers">
            <SearchInput value={search} onChange={setSearch} />
            {(() => {
              const filtered = filter(maneuversList, ["name", "effect"]);
              const grouped: Record<string, typeof filtered> = {};
              for (const m of filtered) {
                const colonIdx = m.name.indexOf(":");
                const cat = colonIdx > 0 ? m.name.substring(0, colonIdx).trim() : "General";
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(m);
              }
              const sortedKeys = Object.keys(grouped).sort((a, b) => a === "General" ? -1 : b === "General" ? 1 : a.localeCompare(b));
              return sortedKeys.map(cat => (
                <div key={cat} className="mb-6">
                  <h3 className="text-lg font-semibold text-primary mb-3" style={{ fontFamily: "var(--font-display)" }}>{cat === "General" ? "General Maneuvers" : cat}</h3>
                  <div className="space-y-2">
                    {grouped[cat].map(m => (
                      <Card key={m.id} className="p-4 cursor-pointer hover-elevate" onClick={() => setDetail({ type: "maneuver", data: m })} data-testid={`comp-maneuver-${m.id}`}>
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{m.name}</span>
                            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                          </div>
                          {m.seeleCost && <Badge variant="secondary" className="shrink-0">{m.seeleCost} Seele</Badge>}
                        </div>
                        {m.effect && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{m.effect}</p>}
                        {m.prerequisite && <p className="mt-1 text-xs text-primary/60">Prereq: {m.prerequisite}</p>}
                      </Card>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </TabsContent>

          <TabsContent value="languages">
            <SearchInput value={search} onChange={setSearch} />
            <div className="space-y-2">
              {filter(langList, ["name", "domain", "effect", "commands"]).map(l => (
                <Card key={l.id} className="p-4 cursor-pointer hover-elevate" onClick={() => setDetail({ type: "language", data: l })} data-testid={`comp-lang-${l.id}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{l.name}</span>
                      <span className="text-xs text-muted-foreground">({l.domain})</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                    </div>
                    <div className="flex gap-2 text-xs font-mono text-muted-foreground">
                      <span>Cost: {l.difficulty}</span>
                      <span>DMG: {l.damage}</span>
                    </div>
                  </div>
                  {l.effect && <p className="mt-1 text-xs text-muted-foreground">{l.effect}</p>}
                  {l.tags && <p className="mt-1 text-xs text-primary/60">{l.tags}</p>}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="archetypes">
            <SearchInput value={search} onChange={setSearch} />
            {(["Initiate", "Acolyte", "Scholar"] as const).map(tier => {
              const tierArchs = filter(archList, ["name", "tier"]).filter(a => a.tier === tier);
              if (tierArchs.length === 0) return null;
              return (
                <div key={tier} className="mb-6">
                  <h3 className="text-lg font-semibold text-primary mb-3" style={{ fontFamily: "var(--font-display)" }}>{tier} Archetypes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {tierArchs.map(a => {
                      const features = (a.features as string[]) || [];
                      return (
                        <Card key={a.id} className="p-4 cursor-pointer hover-elevate" onClick={() => setDetail({ type: "archetype", data: a })} data-testid={`comp-archetype-${a.id}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{a.name}</span>
                            <Badge variant="secondary">{a.tier}</Badge>
                            <ChevronRight className="w-3 h-3 text-muted-foreground/50 ml-auto" />
                          </div>
                          {features.length > 0 && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{features[0]}</p>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="leveling">
            <div className="space-y-2">
              {levelList?.map(l => (
                <Card key={l.id} className="p-4 cursor-pointer hover-elevate" onClick={() => setDetail({ type: "leveling", data: l })} data-testid={`comp-level-${l.id}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary" style={{ fontFamily: "var(--font-display)" }}>Level {l.level}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                    </div>
                  </div>
                  {l.bonuses && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{l.bonuses}</p>}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <DetailDialog item={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

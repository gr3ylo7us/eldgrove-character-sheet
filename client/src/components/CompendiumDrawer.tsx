import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Swords, Shield, Sparkles, Package, Star, Scroll, GraduationCap, Users } from "lucide-react";
import { useWeapons, useArmor, useItems, useSkills, useFeats, useManeuvers, useLanguages, useLeveling, useArchetypes } from "@/hooks/use-game-data";
import { RULES, type RuleEntry } from "@/lib/rules";
import type { Weapon, Armor, Item, Skill, Feat, Maneuver, Language, Archetype, LevelingEntry } from "@shared/schema";

interface CompendiumDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function RulesTab({ search }: { search: string }) {
  const filtered = Object.entries(RULES).filter(([key, rule]) => {
    const q = search.toLowerCase();
    return rule.title.toLowerCase().includes(q) || rule.description.toLowerCase().includes(q) || (rule.category ?? "").toLowerCase().includes(q);
  });

  const grouped: Record<string, [string, RuleEntry][]> = {};
  for (const entry of filtered) {
    const cat = entry[1].category ?? "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(entry);
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, entries]) => (
        <div key={category}>
          <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">{category}</h4>
          <div className="space-y-2">
            {entries.map(([key, rule]) => (
              <Card key={key} className="p-3 space-y-1">
                <div className="text-sm font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>{rule.title}</div>
                {rule.formula && (
                  <div className="bg-secondary/50 rounded px-2 py-1 text-xs font-mono text-primary/80">{rule.formula}</div>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">{rule.description}</p>
                {rule.usage && <p className="text-[11px] text-muted-foreground/70 italic">{rule.usage}</p>}
              </Card>
            ))}
          </div>
        </div>
      ))}
      {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No rules found.</p>}
    </div>
  );
}

function WeaponsTab({ search }: { search: string }) {
  const { data: weapons } = useWeapons();
  const filtered = (weapons ?? []).filter((w: Weapon) => w.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-2">
      {filtered.map((w: Weapon) => (
        <Card key={w.id} className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{w.name}</span>
            {w.type && <Badge variant="secondary" className="text-[10px]">{w.type}</Badge>}
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
            <span>Dice: {w.dice}</span>
            <span>DMG: {w.normalDamage}/{w.critDamage}</span>
            {w.damageType && <span>{w.damageType}</span>}
          </div>
          {w.effects && <p className="text-[11px] text-muted-foreground/70 mt-1 italic">{w.effects}</p>}
        </Card>
      ))}
    </div>
  );
}

function ArmorTab({ search }: { search: string }) {
  const { data: armor } = useArmor();
  const filtered = (armor ?? []).filter((a: Armor) => a.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-2">
      {filtered.map((a: Armor) => (
        <Card key={a.id} className="p-3">
          <span className="text-sm font-semibold">{a.name}</span>
          <div className="flex gap-2 text-xs text-muted-foreground mt-1">
            <span>Prot: {a.protection}</span>
            <span>Eva: {a.evasionDice}</span>
          </div>
          {a.effects && <p className="text-[11px] text-muted-foreground/70 mt-1 italic">{a.effects}</p>}
        </Card>
      ))}
    </div>
  );
}

function SkillsTab({ search }: { search: string }) {
  const { data: skills } = useSkills();
  const filtered = (skills ?? []).filter((s: Skill) => s.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-2">
      {filtered.map((s: Skill) => (
        <Card key={s.id} className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{s.name}</span>
            {s.stat && <Badge variant="secondary" className="text-[10px]">{s.stat}</Badge>}
            {s.category && <Badge variant="outline" className="text-[10px]">{s.category}</Badge>}
          </div>
          {s.overview && <p className="text-[11px] text-muted-foreground/70 mt-1">{s.overview}</p>}
        </Card>
      ))}
    </div>
  );
}

function LanguagesTab({ search }: { search: string }) {
  const { data: languages } = useLanguages();
  const filtered = (languages ?? []).filter((l: Language) => l.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-2">
      {filtered.map((l: Language) => (
        <Card key={l.id} className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{l.name}</span>
            {l.domain && <Badge variant="secondary" className="text-[10px]">{l.domain}</Badge>}
            <Badge variant="outline" className="text-[10px]">Cost: {l.difficulty}</Badge>
          </div>
          {l.effect && <p className="text-[11px] text-muted-foreground/70 mt-1">{l.effect}</p>}
          {l.tags && <p className="text-[10px] text-muted-foreground/50 mt-0.5">Tags: {l.tags}</p>}
        </Card>
      ))}
    </div>
  );
}

function FeatsManeuversTab({ search }: { search: string }) {
  const { data: feats } = useFeats();
  const { data: maneuvers } = useManeuvers();
  const filteredFeats = (feats ?? []).filter((f: Feat) => f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredManeuvers = (maneuvers ?? []).filter((m: Maneuver) => m.name.toLowerCase().includes(search.toLowerCase()));

  const maneuverGroups: Record<string, Maneuver[]> = {};
  for (const m of filteredManeuvers) {
    const colonIdx = m.name.indexOf(":");
    const cat = colonIdx > 0 ? m.name.substring(0, colonIdx).trim() : "General";
    if (!maneuverGroups[cat]) maneuverGroups[cat] = [];
    maneuverGroups[cat].push(m);
  }
  const sortedCats = Object.keys(maneuverGroups).sort((a, b) => a === "General" ? -1 : b === "General" ? 1 : a.localeCompare(b));

  return (
    <div className="space-y-4">
      {filteredFeats.length > 0 && (
        <div>
          <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Feats</h4>
          <div className="space-y-2">
            {filteredFeats.map((f: Feat) => (
              <Card key={f.id} className="p-3">
                <span className="text-sm font-semibold">{f.name}</span>
                {f.effect && <p className="text-[11px] text-muted-foreground/70 mt-1">{f.effect}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}
      {sortedCats.map(cat => (
        <div key={cat}>
          <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">{cat === "General" ? "General Maneuvers" : cat}</h4>
          <div className="space-y-2">
            {maneuverGroups[cat].map((m: Maneuver) => (
              <Card key={m.id} className="p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{m.name}</span>
                  {m.seeleCost && <Badge variant="secondary" className="text-[10px]">Cost: {m.seeleCost}</Badge>}
                </div>
                {m.effect && <p className="text-[11px] text-muted-foreground/70 mt-1">{m.effect}</p>}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ArchetypesTab({ search }: { search: string }) {
  const { data: archetypes } = useArchetypes();
  const filtered = (archetypes ?? []).filter((a: Archetype) => a.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-2">
      {filtered.map((a: Archetype) => (
        <Card key={a.id} className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{a.name}</span>
            {a.tier && <Badge variant="secondary" className="text-[10px]">{a.tier}</Badge>}
          </div>
          {Array.isArray(a.features) && (a.features as any[]).map((f: any, i: number) => (
            <div key={i} className="mt-1">
              <span className="text-xs font-semibold text-primary/80">{f.name}</span>
              {f.description && <p className="text-[11px] text-muted-foreground/70">{f.description}</p>}
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

export function CompendiumDrawer({ open, onOpenChange }: CompendiumDrawerProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("rules");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto" data-testid="compendium-drawer">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-primary" style={{ fontFamily: "var(--font-display)" }}>
            <BookOpen className="w-5 h-5" />
            Compendium
          </SheetTitle>
          <SheetDescription>Game rules, items, and reference data</SheetDescription>
        </SheetHeader>

        <Input
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-3"
          data-testid="input-compendium-drawer-search"
        />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap gap-1 mb-3">
            <TabsTrigger value="rules" className="text-xs"><BookOpen className="w-3 h-3 mr-1" />Rules</TabsTrigger>
            <TabsTrigger value="weapons" className="text-xs"><Swords className="w-3 h-3 mr-1" />Weapons</TabsTrigger>
            <TabsTrigger value="armor" className="text-xs"><Shield className="w-3 h-3 mr-1" />Armor</TabsTrigger>
            <TabsTrigger value="skills" className="text-xs"><Star className="w-3 h-3 mr-1" />Skills</TabsTrigger>
            <TabsTrigger value="languages" className="text-xs"><Sparkles className="w-3 h-3 mr-1" />Languages</TabsTrigger>
            <TabsTrigger value="featsManeuvers" className="text-xs"><Scroll className="w-3 h-3 mr-1" />Feats</TabsTrigger>
            <TabsTrigger value="archetypes" className="text-xs"><Users className="w-3 h-3 mr-1" />Archetypes</TabsTrigger>
          </TabsList>

          <TabsContent value="rules"><RulesTab search={search} /></TabsContent>
          <TabsContent value="weapons"><WeaponsTab search={search} /></TabsContent>
          <TabsContent value="armor"><ArmorTab search={search} /></TabsContent>
          <TabsContent value="skills"><SkillsTab search={search} /></TabsContent>
          <TabsContent value="languages"><LanguagesTab search={search} /></TabsContent>
          <TabsContent value="featsManeuvers"><FeatsManeuversTab search={search} /></TabsContent>
          <TabsContent value="archetypes"><ArchetypesTab search={search} /></TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

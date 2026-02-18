import { useCharacters, useCreateCharacter, useDeleteCharacter } from "@/hooks/use-characters";
import { Link } from "wouter";
import { Scroll, Plus, Trash2, Shield, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { STAT_LABELS, getWoundscaleThreshold } from "@/lib/formulas";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  const { data: characters, isLoading } = useCharacters();
  const createMut = useCreateCharacter();
  const deleteMut = useDeleteCharacter();
  const [newName, setNewName] = useState("");
  const [newRace, setNewRace] = useState("");
  const [open, setOpen] = useState(false);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMut.mutate({ name: newName.trim(), race: newRace.trim() }, {
      onSuccess: () => { setNewName(""); setNewRace(""); setOpen(false); }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground italic" style={{ fontFamily: "var(--font-display)" }}>Consulting the archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl text-primary" style={{ fontFamily: "var(--font-display)" }}>
              Eldgrove Chronicles
            </h1>
            <p className="text-muted-foreground italic text-lg">"Heroes get remembered, but legends never die."</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/compendium">
              <Button variant="outline" data-testid="link-compendium">
                <Scroll className="w-4 h-4 mr-2" /> Compendium
              </Button>
            </Link>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-character"><Plus className="w-4 h-4 mr-2" /> New Character</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle style={{ fontFamily: "var(--font-display)" }}>Create New Character</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input data-testid="input-char-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Enter character name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Race</Label>
                    <Input data-testid="input-char-race" value={newRace} onChange={e => setNewRace(e.target.value)} placeholder="Human, Elf, Orc..." />
                  </div>
                  <Button data-testid="button-submit-create" className="w-full" onClick={handleCreate} disabled={createMut.isPending}>
                    {createMut.isPending ? "Creating..." : "Create Character"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters?.map((char) => (
            <Card key={char.id} className="relative group p-5 hover-elevate" data-testid={`card-character-${char.id}`}>
              <Link href={`/character/${char.id}`} className="block space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="text-xl text-primary" style={{ fontFamily: "var(--font-display)" }}>{char.name}</h3>
                    <p className="text-sm text-muted-foreground italic">{char.race} {char.archetype}</p>
                  </div>
                  <span className="text-xs font-mono bg-secondary px-2 py-1 rounded text-secondary-foreground">
                    LVL {char.level}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 text-xs font-mono">
                  {[
                    { keys: ["power", "finesse", "vitality"], color: "text-red-400" },
                    { keys: ["acumen", "diplomacy", "intuition"], color: "text-blue-400" },
                    { keys: ["talent", "moxie", "audacity"], color: "text-violet-400" },
                  ].map((group) => (
                    <div key={group.keys[0]} className="flex items-center gap-1.5">
                      {group.keys.map(key => (
                        <span key={key} className="flex items-center gap-0.5">
                          <span className={`${group.color}`}>{STAT_LABELS[key]}</span>
                          <span className="text-foreground font-bold">{(char as any)[key] ?? 0}</span>
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Prot: {char.armorProtection}</span>
                  <span className="flex items-center gap-1"><Swords className="w-3 h-3" /> {getWoundscaleThreshold(char.woundsCurrent ?? 0)}</span>
                </div>
              </Link>
              <Button
                size="icon" variant="ghost"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`button-delete-char-${char.id}`}
                onClick={(e) => { e.preventDefault(); deleteMut.mutate(char.id); }}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>

        {characters?.length === 0 && (
          <div className="text-center py-16 border border-dashed border-border/30 rounded-md">
            <p className="text-lg text-muted-foreground" style={{ fontFamily: "var(--font-display)" }}>No chronicles found.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Create a new character to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}

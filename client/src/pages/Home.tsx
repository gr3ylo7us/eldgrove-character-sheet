import { useCharacters, useDeleteCharacter } from "@/hooks/use-characters";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Scroll, Plus, Trash2, Shield, Swords, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { STAT_LABELS, getWoundscaleThreshold } from "@/lib/formulas";

export default function Home() {
  const { data: characters, isLoading } = useCharacters();
  const deleteMut = useDeleteCharacter();
  const { user } = useAuth();

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

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Traveler";
  const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

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
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 mr-2" data-testid="user-profile-info">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profileImageUrl ?? undefined} alt={displayName} />
                <AvatarFallback className="text-xs bg-primary/20 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground/80 hidden sm:inline" style={{ fontFamily: "var(--font-body)" }}>
                {displayName}
              </span>
            </div>
            <Link href="/compendium">
              <Button variant="outline" data-testid="link-compendium">
                <Scroll className="w-4 h-4 mr-2" /> Compendium
              </Button>
            </Link>
            <Link href="/create">
              <Button data-testid="button-create-character"><Plus className="w-4 h-4 mr-2" /> New Character</Button>
            </Link>
            <a href="/api/logout">
              <Button variant="ghost" size="icon" data-testid="button-logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </a>
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

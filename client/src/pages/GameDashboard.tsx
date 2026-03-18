import { useRoute } from "wouter";
import { useGame, useGameMembers, useUpdateGameMember } from "@/hooks/use-games";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Castle, Users, Info, ArrowLeft, Dices, Shield, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { useCharacters } from "@/hooks/use-characters";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { getEvade, getWoundscaleThreshold, getWeaponAttack } from "@/lib/formulas";
import { Badge } from "@/components/ui/badge";
import { Swords, Heart, Shield as ShieldIcon, EyeOff } from "lucide-react";

// Helper to calculate max attack dice based on equipped weapons
function getMaxAttackDice(char: any) {
  const weapons = Array.isArray(char.equippedWeapons) ? char.equippedWeapons : [];
  if (weapons.length === 0) return 0;
  return Math.max(...weapons.map((w: any) => getWeaponAttack(char, w)));
}

export default function GameDashboard() {
  const [, params] = useRoute("/game/:id");
  const gameId = parseInt(params?.id || "0");
  const { data: game, isLoading: gameLoading } = useGame(gameId);
  const { data: members, isLoading: membersLoading } = useGameMembers(gameId);
  const { data: characters } = useCharacters();
  const { mutate: updateMember, isPending: updatingMember } = useUpdateGameMember();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedCharId, setSelectedCharId] = useState<string>("");
  
  if (gameLoading || membersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!game) {
    return <div className="p-8 text-center text-muted-foreground text-xl font-display">Campaign not found.</div>;
  }

  const myMemberRecord = members?.find(m => m.userId === user?.id);
  const isGM = myMemberRecord?.role === "gm";
  const players = members?.filter(m => m.role === "player") || [];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl md:text-5xl text-primary flex items-center gap-3" style={{ fontFamily: "var(--font-display)" }}>
              <Castle className="w-8 h-8 md:w-10 md:h-10 opacity-80" /> {game.name}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <span className="font-mono bg-secondary/30 px-2 py-0.5 rounded text-sm text-secondary-foreground border border-secondary/50">
                Invite Code: <strong className="text-primary">{game.inviteCode}</strong>
              </span>
            </p>
          </div>
          <div className="flex gap-2 text-sm text-muted-foreground items-center bg-card p-3 rounded-lg border border-border/50">
            <Users className="w-5 h-5 text-primary" />
            <span>{players.length} Players connected</span>
          </div>
        </header>

        {isGM ? (
          <div className="space-y-6">
            <h2 className="text-2xl text-foreground" style={{ fontFamily: "var(--font-display)" }}>Player Characters</h2>
            {players.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border/30 rounded-xl bg-card/20">
                <Dices className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-lg text-muted-foreground" style={{ fontFamily: "var(--font-display)" }}>The tavern is empty.</p>
                <p className="text-sm text-muted-foreground/60 mt-1 max-w-sm mx-auto">
                  Send your players the invite code <strong>{game.inviteCode}</strong>. When they join and select a character, they will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map(p => (
                  <Card key={p.id} className="p-4 bg-card/50 border-primary/10">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
                        {p.character ? <Shield className="w-5 h-5 text-primary" /> : <Info className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div>
                        {p.character ? (
                          <>
                            <h3 className="text-lg text-primary font-bold" style={{ fontFamily: "var(--font-display)" }}>
                              {p.character.name}
                            </h3>
                            <p className="text-xs text-muted-foreground font-mono mb-2">
                              LVL {p.character.level} • {p.character.race} {p.character.archetype}
                            </p>
                            
                            {/* GM QoL Quick Stats */}
                            <div className="grid grid-cols-2 gap-2 mt-3 mb-4">
                              <div className="flex items-center gap-1.5 text-xs">
                                <Heart className="w-3.5 h-3.5 text-destructive" />
                                <span className="text-muted-foreground whitespace-nowrap">
                                  Wounds: <strong className="text-foreground">{p.character.woundsCurrent || 0}</strong> ({getWoundscaleThreshold(p.character.woundsCurrent || 0)})
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <ShieldIcon className="w-3.5 h-3.5 text-primary" />
                                <span className="text-muted-foreground">
                                  Evade: <strong className="text-foreground">{getEvade(p.character as any)}</strong>
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <EyeOff className="w-3.5 h-3.5 text-secondary" />
                                <span className="text-muted-foreground">
                                  Skulk: <strong className={!p.character.skulkCurrent ? "text-destructive font-bold" : "text-foreground"}>
                                    {!p.character.skulkCurrent ? "VISIBLE" : p.character.skulkCurrent}
                                  </strong>
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <Swords className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-muted-foreground">
                                  ATK Dice: <strong className="text-foreground">{getMaxAttackDice(p.character)}</strong>
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <Link href={`/character/${p.character.id}`}>
                                <Button size="sm" variant="secondary" className="w-full text-xs">
                                  View Sheet
                                </Button>
                              </Link>
                            </div>
                          </>
                        ) : (
                          <>
                            <h3 className="text-lg text-foreground/50 border-b border-dashed border-border/50 pb-1 w-full" style={{ fontFamily: "var(--font-display)" }}>
                              Unknown Traveler
                            </h3>
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              Has not selected a character yet.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-xl text-primary" style={{ fontFamily: "var(--font-display)" }}>Player Dashboard</h2>
              {myMemberRecord?.characterId ? (
                <div>
                  <p className="text-muted-foreground mb-4">You have selected your hero for this campaign.</p>
                  <Link href={`/character/${myMemberRecord.characterId}`}>
                    <Button size="lg" className="w-full sm:w-auto font-display">Play as Character</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    You have joined the campaign! Now select which of your characters will embark on this journey.
                  </p>
                  
                  {characters && characters.length > 0 ? (
                    <div className="max-w-xs mx-auto space-y-3">
                      <Select value={selectedCharId} onValueChange={setSelectedCharId}>
                        <SelectTrigger className="w-full fantasy-input">
                          <SelectValue placeholder="Select a character..." />
                        </SelectTrigger>
                        <SelectContent>
                          {characters.map(char => (
                            <SelectItem key={char.id} value={char.id.toString()}>
                              {char.name} <span className="text-muted-foreground text-xs ml-2">Lvl {char.level} {char.archetype}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        className="w-full" 
                        disabled={!selectedCharId || updatingMember}
                        onClick={() => {
                          updateMember({ gameId, characterId: parseInt(selectedCharId) }, {
                            onSuccess: () => {
                              toast({ title: "Character Bound", description: "You are ready for adventure." });
                            },
                            onError: (err: any) => {
                              toast({ title: "Failed to bind character", description: err.message, variant: "destructive" });
                            }
                          });
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        {updatingMember ? "Binding..." : "Join as Character"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-destructive italic drop-shadow-sm font-bold">You must create a character before joining a game.</p>
                      <Link href="/create">
                        <Button className="w-full max-w-xs">Create New Character</Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-12">
              <h3 className="text-lg text-muted-foreground mb-4" style={{ fontFamily: "var(--font-display)" }}>The Party</h3>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {players.filter(p => p.id !== myMemberRecord?.id).map(p => (
                   <Card key={p.id} className="min-w-[200px] p-4 bg-background">
                     <p className="font-bold text-foreground text-center" style={{ fontFamily: "var(--font-display)" }}>
                       {p.character?.name || "Unknown"}
                     </p>
                     <p className="text-xs text-muted-foreground text-center mt-1">
                       {p.character ? `${p.character.race} ${p.character.archetype}` : "Selecting hero..."}
                     </p>
                   </Card>
                ))}
                {players.length <= 1 && (
                  <p className="text-sm text-muted-foreground italic pl-2">You are the only member so far...</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

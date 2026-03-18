import { useRoute } from "wouter";
import { useGame, useGameMembers, useUpdateGameMember } from "@/hooks/use-games";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Castle, Users, Info, ArrowLeft, Dices, Shield as ShieldIcon, UserPlus, Map as MapIcon, Plus } from "lucide-react";
import { Link } from "wouter";
import { useCharacters } from "@/hooks/use-characters";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { getEvade, getWoundscaleThreshold, getWeaponAttack } from "@/lib/formulas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVTTWebSocket } from "@/hooks/use-vtt";
import { useScenes, useCreateScene, useUpdateScene, useCreateToken } from "@/hooks/use-vtt-api";
import { VTTCanvas } from "@/components/vtt/VTTCanvas";
import { ChatLog } from "@/components/vtt/ChatLog";
import { useDiceRoller } from "@/components/DiceRoller";
import { Input } from "@/components/ui/input";
import { Heart, Swords, EyeOff } from "lucide-react";

// Helper to calculate max attack dice based on equipped weapons
function getMaxAttackDice(char: any) {
  const weapons = Array.isArray(char.equippedWeapons) ? char.equippedWeapons : [];
  if (weapons.length === 0) return 0;
  return Math.max(...weapons.map((w: any) => getWeaponAttack(char, w)));
}

function VTTTable({ game, myMemberRecord, isGM }: any) {
  const { user } = useAuth();
  const { lastMessage, sendMessage, isConnected } = useVTTWebSocket(game.id, myMemberRecord?.characterId);
  const { data: scenes = [] } = useScenes(game.id);
  const { mutate: createScene, isPending: isCreatingScene } = useCreateScene();
  const { mutate: updateScene } = useUpdateScene();
  const { mutate: createToken, isPending: isCreatingToken } = useCreateToken();
  const { setGameBroadcastContext, clearGameBroadcastContext } = useDiceRoller();
  
  const [newSceneName, setNewSceneName] = useState("");
  const [newSceneBg, setNewSceneBg] = useState("");
  
  useEffect(() => {
    if (myMemberRecord?.characterId || isGM) {
      const sender = myMemberRecord?.character?.name || user?.firstName || "GM";
      setGameBroadcastContext(game.id, sender, sendMessage);
    }
    return () => clearGameBroadcastContext();
  }, [game.id, myMemberRecord, isGM, user, sendMessage, setGameBroadcastContext]);

  const activeScene = scenes.find((s: any) => s.isActive) || scenes[0];

  const handleCreateScene = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSceneName.trim()) return;
    createScene({
      gameId: game.id,
      name: newSceneName,
      backgroundUrl: newSceneBg,
      gridWidth: 20,
      gridHeight: 20
    });
    setNewSceneName("");
    setNewSceneBg("");
  };

  const handleSpawnToken = () => {
    if (!activeScene) return;
    createToken({
      sceneId: activeScene.id,
      name: "New Token",
      x: 0,
      y: 0,
    }, {
      onSuccess: (token: any) => sendMessage({ type: "tokenUpdate", payload: token })
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 mt-4 h-full relative">
      <div className="flex-1 flex flex-col gap-4 min-h-[500px]">
        {/* GM Controls */}
        {isGM && (
          <Card className="p-3 bg-card/60 border-primary/20 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary" style={{ fontFamily: "var(--font-display)" }}>Active Scene:</span>
              <Select 
                value={activeScene?.id?.toString() || ""} 
                onValueChange={(val) => {
                  if (activeScene) updateScene({ id: activeScene.id, gameId: game.id, isActive: false });
                  updateScene({ id: parseInt(val), gameId: game.id, isActive: true });
                  // Broadcast scene change to push clients
                  sendMessage({ type: "system", content: "The GM changed the map." });
                }}
              >
                <SelectTrigger className="w-[200px] h-8 text-xs bg-secondary/10">
                  <SelectValue placeholder="Select a scene..." />
                </SelectTrigger>
                <SelectContent>
                  {scenes.map((s: any) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="h-8" onClick={handleSpawnToken} disabled={!activeScene || isCreatingToken}>
                Spawn Token
              </Button>
              <form onSubmit={handleCreateScene} className="flex gap-2 items-center text-xs">
                <Input className="h-8 w-32" placeholder="New Scene Name" value={newSceneName} onChange={e => setNewSceneName(e.target.value)} />
                <Input className="h-8 w-40" placeholder="Map Image URL..." value={newSceneBg} onChange={e => setNewSceneBg(e.target.value)} />
                <Button type="submit" size="sm" className="h-8 px-2" disabled={isCreatingScene || !newSceneName}>
                  <Plus className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        )}

        {/* Canvas Display */}
        {activeScene ? (
          <VTTCanvas 
            scene={activeScene} 
            gameId={game.id} 
            lastWsMessage={lastMessage} 
            sendMessage={sendMessage} 
            myCharacterId={myMemberRecord?.characterId} 
          />
        ) : (
          <div className="flex-1 flex items-center justify-center border border-dashed border-border/40 rounded-lg bg-card/20 min-h-[400px]">
            <div className="text-center text-muted-foreground/50">
              <MapIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="font-display text-lg">No active scene</p>
              <p className="text-sm max-w-sm mx-auto mt-2">
                {isGM ? "Use the controls above to create and select a map scene." : "Wait for your game master to load a map."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Chat */}
      <div className="w-full lg:w-[350px] shrink-0">
        <ChatLog 
          gameId={game.id} 
          lastWsMessage={lastMessage} 
          sendMessage={sendMessage} 
          myCharacterName={myMemberRecord?.character?.name}
        />
      </div>
    </div>
  );
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
    <div className="min-h-screen p-4 md:p-8 flex flex-col">
      <div className="w-full max-w-[1600px] mx-auto flex-1 flex flex-col">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6 shrink-0">
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
        </header>

        {(!myMemberRecord?.characterId && !isGM) ? (
          <div className="mt-12 bg-primary/5 border border-primary/20 rounded-xl p-6 text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-xl text-primary" style={{ fontFamily: "var(--font-display)" }}>Join the Adventure</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Select which of your characters will embark on this journey.
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
                      onSuccess: () => toast({ title: "Character Bound", description: "You are ready for adventure." }),
                      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
                    });
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {updatingMember ? "Binding..." : "Join Game"}
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
        ) : (
          <Tabs defaultValue="vtt" className="mt-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <TabsList className="bg-card/50 border border-primary/20">
                <TabsTrigger value="vtt" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-display"><MapIcon className="w-4 h-4 mr-2" /> Tabletop</TabsTrigger>
                <TabsTrigger value="party" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-display"><Users className="w-4 h-4 mr-2" /> The Party</TabsTrigger>
              </TabsList>
              
              {!isGM && myMemberRecord?.characterId && (
                <Link href={`/character/${myMemberRecord.characterId}`}>
                  <Button size="sm" variant="outline" className="font-display border-primary/30 text-primary hover:bg-primary/10">Open My Sheet</Button>
                </Link>
              )}
            </div>

            <TabsContent value="vtt" className="flex-1 m-0 focus-visible:outline-none">
              <VTTTable game={game} members={members} myMemberRecord={myMemberRecord} isGM={isGM} players={players} />
            </TabsContent>

            <TabsContent value="party" className="m-0 focus-visible:outline-none space-y-6">
              {players.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border/30 rounded-xl bg-card/20 max-w-2xl mx-auto mt-8">
                  <Dices className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-lg text-muted-foreground" style={{ fontFamily: "var(--font-display)" }}>The tavern is empty.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                  {players.map(p => (
                    <Card key={p.id} className="p-4 bg-card/50 border-primary/10">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 border-b border-border/30 pb-3">
                          <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
                            {p.character ? <ShieldIcon className="w-5 h-5 text-primary" /> : <Info className="w-5 h-5 text-muted-foreground" />}
                          </div>
                          <div>
                            <h3 className="text-lg text-primary font-bold leading-none" style={{ fontFamily: "var(--font-display)" }}>
                              {p.character ? p.character.name : "Unknown Traveler"}
                            </h3>
                            {p.character && (
                              <p className="text-xs text-muted-foreground font-mono mt-1">
                                LVL {p.character.level} • {p.character.race} {p.character.archetype}
                              </p>
                            )}
                          </div>
                        </div>

                        {p.character ? (
                          <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                            <div className="flex flex-col gap-1 text-xs">
                              <span className="text-muted-foreground/70 uppercase tracking-widest text-[10px] font-bold">Wounds</span>
                              <div className="flex items-center gap-1.5 flex-nowrap">
                                <Heart className="w-3.5 h-3.5 text-destructive shrink-0" />
                                <span className="truncate">
                                  <strong className="text-foreground">{p.character.woundsCurrent || 0}</strong> <span className="text-muted-foreground text-[10px]">({getWoundscaleThreshold(p.character.woundsCurrent || 0)})</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 text-xs">
                              <span className="text-muted-foreground/70 uppercase tracking-widest text-[10px] font-bold">Evade</span>
                              <div className="flex items-center gap-1.5 flex-nowrap">
                                <ShieldIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span><strong className="text-foreground">{getEvade(p.character as any)}</strong></span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 text-xs">
                              <span className="text-muted-foreground/70 uppercase tracking-widest text-[10px] font-bold">Skulk</span>
                              <div className="flex items-center gap-1.5 flex-nowrap">
                                <EyeOff className="w-3.5 h-3.5 text-secondary shrink-0" />
                                <strong className={!p.character.skulkCurrent ? "text-destructive font-bold" : "text-foreground"}>
                                  {!p.character.skulkCurrent ? "VISIBLE" : p.character.skulkCurrent}
                                </strong>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 text-xs">
                              <span className="text-muted-foreground/70 uppercase tracking-widest text-[10px] font-bold">Max Dice</span>
                              <div className="flex items-center gap-1.5 flex-nowrap">
                                <Swords className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <strong className="text-foreground">{getMaxAttackDice(p.character)}</strong>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-2 italic flex-1 flex items-center justify-center">
                            Has not selected a character yet.
                          </p>
                        )}
                        
                        {isGM && p.character && (
                          <div className="pt-3 border-t border-border/30 mt-auto">
                            <Link href={`/character/${p.character.id}`}>
                              <Button size="sm" variant="secondary" className="w-full text-xs">
                                Open Sheet
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

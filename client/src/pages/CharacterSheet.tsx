import { useCharacter, useUpdateCharacter, useDeleteCharacter } from "@/hooks/use-characters";
import { useRoute, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatCard } from "@/components/StatCard";
import { DiceRoller } from "@/components/DiceRoller";
import { ArrowLeft, Save, Trash2, Shield, Heart, Zap, Scroll, Backpack, Swords } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Helper for type safety with JSONB
const getStats = (char: any) => {
  return char.stats as Record<string, number> || {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  };
};

export default function CharacterSheet() {
  const [match, params] = useRoute("/character/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0");
  
  const { data: character, isLoading } = useCharacter(id);
  const updateMutation = useUpdateCharacter();
  const deleteMutation = useDeleteCharacter();

  // Local state for edits
  const [localStats, setLocalStats] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (character) {
      setLocalStats(getStats(character));
      setNotes(character.notes || "");
    }
  }, [character]);

  const handleStatChange = (stat: string, delta: number) => {
    setLocalStats(prev => ({
      ...prev,
      [stat]: Math.max(1, (prev[stat] || 10) + delta)
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate({
      id,
      stats: localStats,
      notes
    }, {
      onSuccess: () => setHasChanges(false)
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => setLocation("/")
    });
  };

  if (isLoading || !character) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header / Nav */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/30 px-6 py-4 flex justify-between items-center">
        <Button variant="ghost" onClick={() => setLocation("/")} className="gap-2 text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Back to Chronicles
        </Button>

        <div className="flex items-center gap-2">
           {hasChanges && (
            <Button 
              onClick={handleSave} 
              disabled={updateMutation.isPending}
              className="bg-primary text-primary-foreground font-display animate-in fade-in slide-in-from-top-4"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-destructive/50 hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-destructive">Delete Character?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This character will be lost to the void forever.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Forever
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Character Header Info */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-display text-primary">{character.name}</h1>
              <p className="text-xl text-muted-foreground font-body italic mt-1">
                Level {character.level} {character.race} {character.class}
              </p>
            </div>
            
            {/* Vital Stats Bar */}
            <div className="grid grid-cols-3 gap-4 max-w-lg">
              <div className="fantasy-card p-3 flex items-center gap-3 border-l-4 border-l-red-900">
                <div className="p-2 bg-red-900/20 rounded-full text-red-500"><Heart className="w-5 h-5" /></div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Health</div>
                  <div className="font-display font-bold text-xl">45 / 45</div>
                </div>
              </div>
              <div className="fantasy-card p-3 flex items-center gap-3 border-l-4 border-l-blue-900">
                <div className="p-2 bg-blue-900/20 rounded-full text-blue-500"><Zap className="w-5 h-5" /></div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Mana</div>
                  <div className="font-display font-bold text-xl">12 / 20</div>
                </div>
              </div>
              <div className="fantasy-card p-3 flex items-center gap-3 border-l-4 border-l-gray-600">
                <div className="p-2 bg-gray-700/20 rounded-full text-gray-400"><Shield className="w-5 h-5" /></div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Armor</div>
                  <div className="font-display font-bold text-xl">16</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-border/20 rounded-none h-auto p-0 gap-6">
            <TabsTrigger 
              value="stats" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none pb-4 px-2 font-display tracking-widest text-lg text-muted-foreground hover:text-primary/70 transition-all"
            >
              Attributes
            </TabsTrigger>
            <TabsTrigger 
              value="skills" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none pb-4 px-2 font-display tracking-widest text-lg text-muted-foreground hover:text-primary/70 transition-all"
            >
              Skills & Abilities
            </TabsTrigger>
            <TabsTrigger 
              value="inventory" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none pb-4 px-2 font-display tracking-widest text-lg text-muted-foreground hover:text-primary/70 transition-all"
            >
              Inventory
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none pb-4 px-2 font-display tracking-widest text-lg text-muted-foreground hover:text-primary/70 transition-all"
            >
              Journal
            </TabsTrigger>
          </TabsList>

          <div className="mt-8 min-h-[400px]">
            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {Object.entries(localStats).map(([key, value]) => (
                  <StatCard 
                    key={key} 
                    label={key} 
                    value={value} 
                    editable 
                    onIncrement={() => handleStatChange(key, 1)}
                    onDecrement={() => handleStatChange(key, -1)}
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="fantasy-card p-6">
                  <h3 className="font-display text-xl mb-4 flex items-center gap-2 text-primary">
                    <Swords className="w-5 h-5" /> Combat
                  </h3>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center border-b border-border/20 pb-2">
                       <span className="text-muted-foreground">Proficiency Bonus</span>
                       <span className="font-display font-bold text-lg">+2</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-border/20 pb-2">
                       <span className="text-muted-foreground">Initiative</span>
                       <span className="font-display font-bold text-lg text-primary">
                         {Math.floor((localStats.dexterity - 10) / 2) >= 0 ? "+" : ""}
                         {Math.floor((localStats.dexterity - 10) / 2)}
                       </span>
                     </div>
                     <div className="flex justify-between items-center border-b border-border/20 pb-2">
                       <span className="text-muted-foreground">Speed</span>
                       <span className="font-display font-bold text-lg">30 ft</span>
                     </div>
                  </div>
                </div>

                <div className="fantasy-card p-6">
                  <h3 className="font-display text-xl mb-4 flex items-center gap-2 text-primary">
                    <Shield className="w-5 h-5" /> Defenses
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No active conditions.</p>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mt-4">
                      <div className="h-full w-full bg-green-900/40"></div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="skills">
              <div className="text-center py-20 text-muted-foreground italic font-body text-xl">
                The archives on skills are currently being transcribed...
              </div>
            </TabsContent>
            
            <TabsContent value="inventory">
              <div className="text-center py-20 text-muted-foreground italic font-body text-xl">
                Your satchel appears empty...
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <div className="fantasy-card p-6 min-h-[500px] flex flex-col">
                 <h3 className="font-display text-xl mb-4 flex items-center gap-2 text-primary">
                    <Scroll className="w-5 h-5" /> Campaign Notes
                  </h3>
                  <Textarea 
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setHasChanges(true);
                    }}
                    placeholder="Record your adventures here..."
                    className="flex-1 bg-transparent border-none resize-none focus-visible:ring-0 text-lg font-body leading-relaxed parchment-texture text-gray-900 placeholder:text-gray-500 p-8 rounded-lg shadow-inner"
                  />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <DiceRoller />
    </div>
  );
}

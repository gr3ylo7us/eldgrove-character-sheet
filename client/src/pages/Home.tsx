import { useCharacters } from "@/hooks/use-characters";
import { Link } from "wouter";
import { CreateCharDialog } from "@/components/CreateCharDialog";
import { DiceRoller } from "@/components/DiceRoller";
import { Scroll, Skull, User } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: characters, isLoading } = useCharacters();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 animate-pulse">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-display text-xl text-primary/60">Consulting the archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 pb-24">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-border/30 pb-8">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl text-primary">Eldgrove Chronicles</h1>
            <p className="font-body text-xl text-muted-foreground italic">"Heroes get remembered, but legends never die."</p>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters?.map((char) => (
            <Link key={char.id} href={`/character/${char.id}`} className="group cursor-pointer">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="fantasy-card h-full p-6 flex flex-col gap-4 group-hover:border-primary/50"
              >
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center text-primary/50">
                    {char.isNpc ? <Skull className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground border border-border/30 px-2 py-1 rounded">
                    LVL {char.level}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-2xl font-display text-foreground group-hover:text-primary transition-colors">
                    {char.name}
                  </h3>
                  <p className="text-muted-foreground font-body italic">
                    {char.race} {char.class}
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-border/10 flex justify-between text-sm text-muted-foreground/60">
                  <span className="flex items-center gap-1">
                    <Scroll className="w-3 h-3" /> View Sheet
                  </span>
                </div>
              </motion.div>
            </Link>
          ))}
          
          {characters?.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-border/20 rounded-2xl">
              <p className="font-display text-2xl text-muted-foreground/50">No chronicles found.</p>
              <p className="text-muted-foreground/30 mt-2">Create a new character to begin.</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-4">
        <CreateCharDialog />
      </div>

      <DiceRoller />
    </div>
  );
}

import { useState } from "react";
import { Dices, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RollResult {
  id: number;
  die: number;
  value: number;
  isCrit: boolean;
  isCritFail: boolean;
}

export function DiceRoller() {
  const [results, setResults] = useState<RollResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const roll = (die: number) => {
    const value = Math.floor(Math.random() * die) + 1;
    const newResult = {
      id: Date.now(),
      die,
      value,
      isCrit: value === die,
      isCritFail: value === 1,
    };
    setResults(prev => [newResult, ...prev].slice(0, 5));
  };

  const dice = [4, 6, 8, 10, 12, 20];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <AnimatePresence>
          {results.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: 50, scale: 0.5 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50 }}
              className={`
                px-4 py-2 rounded-lg font-display text-lg font-bold shadow-xl border
                flex items-center gap-3 backdrop-blur-md
                ${r.isCrit ? "bg-yellow-500/20 border-yellow-500 text-yellow-200" : ""}
                ${r.isCritFail ? "bg-red-900/40 border-red-500 text-red-200" : ""}
                ${!r.isCrit && !r.isCritFail ? "bg-background/90 border-border text-foreground" : ""}
              `}
            >
              <span className="text-xs uppercase opacity-50 tracking-wider">d{r.die}</span>
              <span className="text-2xl">{r.value}</span>
              {r.isCrit && <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="pointer-events-auto relative">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-full right-0 mb-4 p-4 rounded-xl bg-card border border-primary/30 shadow-2xl shadow-black flex flex-col gap-2 w-48"
            >
              <div className="text-xs font-display text-center text-muted-foreground mb-2">Roll the Bones</div>
              <div className="grid grid-cols-3 gap-2">
                {dice.map(d => (
                  <button
                    key={d}
                    onClick={() => roll(d)}
                    className="
                      aspect-square flex flex-col items-center justify-center rounded-md
                      bg-secondary/50 hover:bg-primary/20 hover:text-primary hover:border-primary/50
                      border border-transparent transition-all duration-200
                      active:scale-90 font-display font-bold
                    "
                  >
                    <span>d{d}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            h-14 w-14 rounded-full flex items-center justify-center
            shadow-lg shadow-black/50 border-2 transition-all duration-300
            ${isOpen 
              ? "bg-primary text-primary-foreground border-primary rotate-180" 
              : "bg-card text-foreground border-border hover:border-primary hover:text-primary"
            }
          `}
        >
          <Dices className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}

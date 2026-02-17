import { motion } from "framer-motion";
import { type Stat } from "@shared/schema";
import { Minus, Plus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  modifier?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
  editable?: boolean;
}

export function StatCard({ label, value, modifier, onIncrement, onDecrement, editable = false }: StatCardProps) {
  const displayModifier = modifier !== undefined 
    ? modifier 
    : Math.floor((value - 10) / 2);

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="fantasy-card p-4 flex flex-col items-center justify-center gap-2 aspect-[3/4] relative group"
    >
      <div className="font-display text-sm tracking-widest text-muted-foreground uppercase">{label}</div>
      
      <div className="relative flex items-center justify-center w-full">
        {editable && (
          <button 
            onClick={onDecrement}
            className="absolute left-0 p-1 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
        )}
        
        <div className="text-4xl font-display font-bold text-primary drop-shadow-md">
          {value}
        </div>

        {editable && (
          <button 
            onClick={onIncrement}
            className="absolute right-0 p-1 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="absolute -bottom-3 bg-secondary px-3 py-1 rounded-full border border-border/50 shadow-lg">
        <span className={`font-mono font-bold text-sm ${displayModifier >= 0 ? "text-green-400" : "text-red-400"}`}>
          {displayModifier >= 0 ? "+" : ""}{displayModifier}
        </span>
      </div>
    </motion.div>
  );
}

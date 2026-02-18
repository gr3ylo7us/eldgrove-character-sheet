import { useState, useCallback, createContext, useContext } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dices, Trash2, Sparkles, Minus, Plus, Skull, TrendingDown } from "lucide-react";

export interface DieResult {
  value: number;
  isSuccess: boolean;
  isCrit: boolean;
  isSubtract: boolean;
}

export interface RollResult {
  id: number;
  label: string;
  dice: DieResult[];
  totalSuccesses: number;
  totalCrits: number;
  totalSubtracts: number;
  netSuccesses: number;
  poolSize: number;
  threshold: number;
  timestamp: Date;
  effects?: string[];
}

interface DiceRollerContextType {
  rollDice: (poolSize: number, label: string, threshold?: number, effects?: string[]) => RollResult;
  openRoller: () => void;
  closeRoller: () => void;
  isOpen: boolean;
}

const DiceRollerContext = createContext<DiceRollerContextType | null>(null);

export function useDiceRoller() {
  const ctx = useContext(DiceRollerContext);
  if (!ctx) throw new Error("useDiceRoller must be inside DiceRollerProvider");
  return ctx;
}

function rollPool(poolSize: number, threshold: number = 11): { dice: DieResult[]; totalSuccesses: number; totalCrits: number; totalSubtracts: number; netSuccesses: number } {
  const dice: DieResult[] = [];
  let totalSuccesses = 0;
  let totalCrits = 0;
  let totalSubtracts = 0;

  for (let i = 0; i < poolSize; i++) {
    const value = Math.floor(Math.random() * 20) + 1;
    const isCrit = value >= 18;
    const isSubtract = value <= 3;
    const isSuccess = value >= threshold;

    if (isCrit) {
      totalSuccesses += 2;
      totalCrits++;
    } else if (isSuccess) {
      totalSuccesses += 1;
    }
    if (isSubtract) {
      totalSubtracts++;
    }

    dice.push({ value, isSuccess: isSuccess || isCrit, isCrit, isSubtract });
  }

  return { dice, totalSuccesses, totalCrits, totalSubtracts, netSuccesses: totalSuccesses - totalSubtracts };
}

function DieDisplay({ die }: { die: DieResult }) {
  let bg = "bg-secondary/50 text-foreground";
  if (die.isCrit) bg = "bg-amber-500/20 text-amber-300 border-amber-500/50";
  else if (die.isSubtract) bg = "bg-red-500/20 text-red-400 border-red-500/50";
  else if (die.isSuccess) bg = "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";

  return (
    <div className={`w-9 h-9 rounded-md border flex items-center justify-center text-sm font-bold font-mono ${bg}`}>
      {die.value}
    </div>
  );
}

function RollResultDisplay({ result }: { result: RollResult }) {
  const isPositive = result.netSuccesses > 0;
  const isNegative = result.netSuccesses < 0;

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>{result.label}</span>
        <div className="flex items-center gap-2">
          {result.threshold !== 11 && <Badge variant="outline" className="text-[10px]">TN {result.threshold}+</Badge>}
          <Badge variant={isPositive ? "default" : isNegative ? "destructive" : "secondary"} className="text-xs">
            {result.netSuccesses} net
          </Badge>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {result.dice.map((d, i) => <DieDisplay key={i} die={d} />)}
      </div>
      <div className="flex gap-3 text-[10px] text-muted-foreground font-mono">
        <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" />{result.totalCrits} crits</span>
        <span className="flex items-center gap-1 text-emerald-400">{result.totalSuccesses} hits</span>
        <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-400" />{result.totalSubtracts} subs</span>
      </div>
      {result.effects && result.effects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {result.effects.map((e, i) => <Badge key={i} variant="outline" className="text-[10px]">{e}</Badge>)}
        </div>
      )}
    </Card>
  );
}

export function DiceRollerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<RollResult[]>([]);
  const [manualPool, setManualPool] = useState(3);
  const [manualThreshold, setManualThreshold] = useState(11);
  const [manualLabel, setManualLabel] = useState("Manual Roll");

  const rollDice = useCallback((poolSize: number, label: string, threshold: number = 11, effects?: string[]) => {
    const result = rollPool(poolSize, threshold);
    const rollResult: RollResult = {
      id: Date.now(),
      label,
      ...result,
      poolSize,
      threshold,
      timestamp: new Date(),
      effects,
    };
    setHistory(prev => [rollResult, ...prev].slice(0, 20));
    setIsOpen(true);
    return rollResult;
  }, []);

  return (
    <DiceRollerContext.Provider value={{ rollDice, openRoller: () => setIsOpen(true), closeRoller: () => setIsOpen(false), isOpen }}>
      {children}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto" data-testid="dice-roller-drawer">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2 text-primary" style={{ fontFamily: "var(--font-display)" }}>
              <Dices className="w-5 h-5" />
              Dice Roller
            </SheetTitle>
            <SheetDescription>Roll d20 pools. 11+ = success, 18-20 = crit (2 hits), 1-3 = subtract.</SheetDescription>
          </SheetHeader>

          <Card className="p-4 mb-4 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={manualLabel}
                onChange={e => setManualLabel(e.target.value)}
                className="flex-1"
                placeholder="Roll label..."
                data-testid="input-dice-label"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground w-10">Pool:</span>
                <Button size="icon" variant="ghost" onClick={() => setManualPool(Math.max(1, manualPool - 1))} data-testid="button-pool-dec">
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  type="number"
                  className="w-14 text-center"
                  value={manualPool}
                  onChange={e => setManualPool(Math.max(1, parseInt(e.target.value) || 1))}
                  data-testid="input-dice-pool"
                />
                <Button size="icon" variant="ghost" onClick={() => setManualPool(manualPool + 1)} data-testid="button-pool-inc">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground w-8">TN:</span>
                <Button size="icon" variant="ghost" onClick={() => setManualThreshold(Math.max(1, manualThreshold - 1))} data-testid="button-threshold-dec">
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  type="number"
                  className="w-14 text-center"
                  value={manualThreshold}
                  onChange={e => setManualThreshold(Math.max(1, Math.min(20, parseInt(e.target.value) || 11)))}
                  data-testid="input-dice-threshold"
                />
                <Button size="icon" variant="ghost" onClick={() => setManualThreshold(Math.min(20, manualThreshold + 1))} data-testid="button-threshold-inc">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => rollDice(manualPool, manualLabel, manualThreshold)}
              data-testid="button-roll-dice"
            >
              <Dices className="w-4 h-4 mr-2" /> Roll {manualPool}d20
            </Button>
          </Card>

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Roll History</span>
            {history.length > 0 && (
              <Button size="icon" variant="ghost" onClick={() => setHistory([])} data-testid="button-clear-history">
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {history.map(r => <RollResultDisplay key={r.id} result={r} />)}
            {history.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No rolls yet. Roll some dice!</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </DiceRollerContext.Provider>
  );
}

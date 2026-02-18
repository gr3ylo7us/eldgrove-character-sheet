import { useState, useCallback, useRef, createContext, useContext } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dices, Trash2, Sparkles, Minus, Plus, TrendingDown, RotateCcw, Zap, Shield, Wand2, EyeOff } from "lucide-react";

export interface DieResult {
  value: number;
  isSuccess: boolean;
  isCrit: boolean;
  isSubtract: boolean;
  rerolled?: boolean;
  isSneakDie?: boolean;
}

export type RollType = "manual" | "stat" | "weapon" | "spell" | "skill" | "evade" | "skulk";

export interface DamageInfo {
  normalDamage?: string;
  critDamage?: string;
  damageType?: string;
  languageDamage?: string;
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
  rollType: RollType;
  damageInfo?: DamageInfo;
  damageOutput?: string;
  convertedToEffects: number;
  sneakDice: number;
}

export interface RollOptions {
  poolSize: number;
  label: string;
  threshold?: number;
  effects?: string[];
  rollType?: RollType;
  damageInfo?: DamageInfo;
  isSilent?: boolean;
  skulkAvailable?: number;
}

interface DiceRollerContextType {
  rollDice: (opts: RollOptions) => RollResult | null;
  openRoller: () => void;
  closeRoller: () => void;
  isOpen: boolean;
  onSkulkSpent: React.MutableRefObject<((amount: number) => void) | null>;
}

const DiceRollerContext = createContext<DiceRollerContextType | null>(null);

export function useDiceRoller() {
  const ctx = useContext(DiceRollerContext);
  if (!ctx) throw new Error("useDiceRoller must be inside DiceRollerProvider");
  return ctx;
}

function rollSingleDie(threshold: number = 11): DieResult {
  const value = Math.floor(Math.random() * 20) + 1;
  const isCrit = value >= 18;
  const isSubtract = value <= 3;
  const isSuccess = value >= threshold;
  return { value, isSuccess: isSuccess || isCrit, isCrit, isSubtract };
}

function computeResults(dice: DieResult[]) {
  let totalSuccesses = 0;
  let totalCrits = 0;
  let totalSubtracts = 0;
  for (const d of dice) {
    if (d.isCrit) { totalSuccesses += 2; totalCrits++; }
    else if (d.isSuccess) { totalSuccesses += 1; }
    if (d.isSubtract) { totalSubtracts++; }
  }
  return { totalSuccesses, totalCrits, totalSubtracts, netSuccesses: totalSuccesses - totalSubtracts };
}

function rollPool(poolSize: number, threshold: number = 11) {
  const dice: DieResult[] = [];
  for (let i = 0; i < poolSize; i++) dice.push(rollSingleDie(threshold));
  return { dice, ...computeResults(dice) };
}

function calculateDamage(netSuccesses: number, crits: number, damageInfo?: DamageInfo, convertedToEffects: number = 0): string | undefined {
  if (!damageInfo) return undefined;
  const effectiveNet = Math.max(0, netSuccesses - convertedToEffects);
  if (effectiveNet <= 0) return "Miss";

  if (damageInfo.normalDamage && damageInfo.critDamage) {
    const normalHits = Math.max(0, effectiveNet - crits);
    const critHits = Math.min(crits, effectiveNet);
    const parts: string[] = [];
    if (normalHits > 0) parts.push(`${normalHits}x${damageInfo.normalDamage}`);
    if (critHits > 0) parts.push(`${critHits}x${damageInfo.critDamage} (crit)`);
    const dmgType = damageInfo.damageType ? ` ${damageInfo.damageType}` : "";
    return parts.join(" + ") + dmgType;
  }

  if (damageInfo.languageDamage) {
    const parts = damageInfo.languageDamage.split("/");
    const normal = parts[0] || "?";
    const crit = parts[1] || normal;
    const normalHits = Math.max(0, effectiveNet - crits);
    const critHits = Math.min(crits, effectiveNet);
    const out: string[] = [];
    if (normalHits > 0) out.push(`${normalHits}x${normal}`);
    if (critHits > 0) out.push(`${critHits}x${crit} (crit)`);
    return out.join(" + ");
  }

  return undefined;
}

const hexClip = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

function DieDisplay({ die, onClick, clickable }: { die: DieResult; onClick?: () => void; clickable?: boolean }) {
  let bg = "bg-secondary/50 text-foreground";
  if (die.isCrit) bg = "bg-amber-500/20 text-amber-300";
  else if (die.isSubtract) bg = "bg-red-500/20 text-red-400";
  else if (die.isSuccess) bg = "bg-emerald-500/20 text-emerald-400";

  let border = "border-border/40";
  if (die.isCrit) border = "border-amber-500/50";
  else if (die.isSubtract) border = "border-red-500/50";
  else if (die.isSuccess) border = "border-emerald-500/50";

  if (die.isSneakDie) {
    border = die.isCrit ? "border-amber-500/50" : die.isSubtract ? "border-red-500/50" : die.isSuccess ? "border-emerald-500/50" : "border-indigo-500/50";
  }

  return (
    <div
      className={`relative w-10 h-11 flex items-center justify-center text-sm font-bold font-mono ${clickable ? "cursor-pointer" : ""} ${die.rerolled ? "ring-1 ring-primary/40" : ""}`}
      style={{ clipPath: hexClip }}
      onClick={clickable ? onClick : undefined}
      title={clickable ? "Click to reroll" : die.isSneakDie ? "Sneak attack die" : undefined}
      data-testid="die-result"
    >
      <div className={`absolute inset-0 ${bg}`} style={{ clipPath: hexClip }} />
      <div className={`absolute inset-0 border-2 ${border}`} style={{ clipPath: hexClip }} />
      <span className="relative z-10">{die.value}</span>
      {die.rerolled && (
        <RotateCcw className="absolute top-0 right-0 w-2.5 h-2.5 text-primary/60 z-10" />
      )}
      {die.isSneakDie && !die.rerolled && (
        <EyeOff className="absolute top-0 right-0 w-2.5 h-2.5 text-indigo-400 z-10" />
      )}
    </div>
  );
}

function RollResultDisplay({ result, onReroll, onConvertEffect }: {
  result: RollResult;
  onReroll: (rollId: number, dieIndex: number) => void;
  onConvertEffect: (rollId: number, delta: number) => void;
}) {
  const isPositive = result.netSuccesses > 0;
  const isNegative = result.netSuccesses < 0;
  const isAttack = result.rollType === "weapon" || result.rollType === "spell";
  const isSpell = result.rollType === "spell";
  const effectiveNet = Math.max(0, result.netSuccesses - result.convertedToEffects);
  const canConvertMore = isSpell && effectiveNet > 0;
  const canUnconvert = isSpell && result.convertedToEffects > 0;

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>{result.label}</span>
        <div className="flex items-center gap-2 flex-wrap">
          {result.rollType === "evade" && <Badge variant="outline" className="text-[10px]"><Shield className="w-2.5 h-2.5 mr-0.5" />Evade</Badge>}
          {result.rollType === "skulk" && <Badge variant="outline" className="text-[10px]"><EyeOff className="w-2.5 h-2.5 mr-0.5" />Skulk</Badge>}
          {result.sneakDice > 0 && <Badge variant="outline" className="text-[10px] border-indigo-500/50 text-indigo-400"><EyeOff className="w-2.5 h-2.5 mr-0.5" />+{result.sneakDice} sneak</Badge>}
          {result.threshold !== 11 && <Badge variant="outline" className="text-[10px]">TN {result.threshold}+</Badge>}
          <Badge variant={isPositive ? "default" : isNegative ? "destructive" : "secondary"} className="text-xs">
            {result.netSuccesses} net
          </Badge>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {result.dice.map((d, i) => (
          <DieDisplay
            key={`${result.id}-${i}`}
            die={d}
            onClick={() => onReroll(result.id, i)}
            clickable
          />
        ))}
      </div>
      <div className="flex gap-3 text-[10px] text-muted-foreground font-mono flex-wrap">
        <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" />{result.totalCrits} crits</span>
        <span className="flex items-center gap-1 text-emerald-400">{result.totalSuccesses} hits</span>
        <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-400" />{result.totalSubtracts} subs</span>
      </div>

      {isAttack && result.damageOutput && (
        <div className="pt-1 border-t border-border/30">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono font-semibold text-primary">{result.damageOutput}</span>
          </div>
        </div>
      )}

      {isSpell && result.netSuccesses > 0 && (
        <div className="pt-1 border-t border-border/30 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
              <Wand2 className="w-3 h-3" />
              Convert hits to effects:
            </span>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={() => onConvertEffect(result.id, -1)} disabled={!canUnconvert} data-testid="button-unconvert-effect">
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-xs font-mono w-5 text-center">{result.convertedToEffects}</span>
              <Button size="icon" variant="ghost" onClick={() => onConvertEffect(result.id, 1)} disabled={!canConvertMore} data-testid="button-convert-effect">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          {result.convertedToEffects > 0 && (
            <div className="text-[10px] text-muted-foreground font-mono">
              {result.convertedToEffects} hit{result.convertedToEffects !== 1 ? "s" : ""} applied to effects/size/duration
              {effectiveNet > 0 ? ` | ${effectiveNet} for damage` : " | No damage (all converted)"}
            </div>
          )}
        </div>
      )}

      {result.effects && result.effects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {result.effects.map((e, i) => <Badge key={i} variant="outline" className="text-[10px]">{e}</Badge>)}
        </div>
      )}
    </Card>
  );
}

function SneakAttackPanel({ pendingRoll, onRoll, onCancel }: {
  pendingRoll: RollOptions;
  onRoll: (sneakDice: number) => void;
  onCancel: () => void;
}) {
  const maxSneak = pendingRoll.skulkAvailable ?? 0;
  const [sneakDice, setSneakDice] = useState(0);

  return (
    <Card className="p-4 mb-4 space-y-3 border-indigo-500/30">
      <div className="flex items-center gap-2">
        <EyeOff className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>Sneak Attack</span>
        <Badge variant="outline" className="text-[10px] ml-auto">Silent</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        This attack has the Silent property. Spend SKULK to add bonus dice to your attack roll.
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">SKULK available: <span className="text-indigo-400 font-bold">{maxSneak}</span></span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Spend:</span>
        <Button size="icon" variant="ghost" onClick={() => setSneakDice(Math.max(0, sneakDice - 1))} disabled={sneakDice <= 0} data-testid="button-sneak-dec">
          <Minus className="w-3 h-3" />
        </Button>
        <span className="text-lg font-bold text-indigo-400 w-8 text-center" data-testid="text-sneak-dice">{sneakDice}</span>
        <Button size="icon" variant="ghost" onClick={() => setSneakDice(Math.min(maxSneak, sneakDice + 1))} disabled={sneakDice >= maxSneak} data-testid="button-sneak-inc">
          <Plus className="w-3 h-3" />
        </Button>
        <span className="text-xs text-muted-foreground ml-2">
          Total pool: <span className="font-bold">{pendingRoll.poolSize + sneakDice}d20</span>
        </span>
      </div>
      {maxSneak <= 0 && (
        <p className="text-xs text-destructive">No SKULK remaining. Roll without sneak bonus.</p>
      )}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => onRoll(sneakDice)} data-testid="button-confirm-sneak-roll">
          <Dices className="w-4 h-4 mr-2" />
          Roll {pendingRoll.poolSize + sneakDice}d20
          {sneakDice > 0 && <span className="ml-1 text-indigo-300">(+{sneakDice} sneak)</span>}
        </Button>
        <Button variant="outline" onClick={onCancel} data-testid="button-cancel-sneak">
          Skip
        </Button>
      </div>
    </Card>
  );
}

export function DiceRollerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<RollResult[]>([]);
  const [manualPool, setManualPool] = useState(3);
  const [manualThreshold, setManualThreshold] = useState(11);
  const [manualLabel, setManualLabel] = useState("Manual Roll");
  const [pendingSilentRoll, setPendingSilentRoll] = useState<RollOptions | null>(null);
  const onSkulkSpentRef = useRef<((amount: number) => void) | null>(null);

  const executeRoll = useCallback((opts: RollOptions, sneakDice: number = 0): RollResult => {
    const { poolSize, label, threshold = 11, effects, rollType = "manual", damageInfo } = opts;
    const totalPool = poolSize + sneakDice;
    const result = rollPool(totalPool, threshold);
    if (sneakDice > 0) {
      for (let i = poolSize; i < totalPool; i++) {
        result.dice[i].isSneakDie = true;
      }
    }
    const dmg = calculateDamage(result.netSuccesses, result.totalCrits, damageInfo);
    const rollResult: RollResult = {
      id: Date.now(),
      label,
      ...result,
      poolSize: totalPool,
      threshold,
      timestamp: new Date(),
      effects,
      rollType,
      damageInfo,
      damageOutput: dmg,
      convertedToEffects: 0,
      sneakDice,
    };
    setHistory(prev => [rollResult, ...prev].slice(0, 20));
    return rollResult;
  }, []);

  const rollDice = useCallback((opts: RollOptions): RollResult | null => {
    if (opts.isSilent && (opts.skulkAvailable ?? 0) > 0) {
      setPendingSilentRoll(opts);
      setIsOpen(true);
      return null;
    }
    const result = executeRoll(opts);
    setIsOpen(true);
    return result;
  }, [executeRoll]);

  const handleSneakRoll = useCallback((sneakDice: number) => {
    if (!pendingSilentRoll) return;
    const result = executeRoll(pendingSilentRoll, sneakDice);
    if (sneakDice > 0 && onSkulkSpentRef.current) {
      onSkulkSpentRef.current(sneakDice);
    }
    setPendingSilentRoll(null);
  }, [pendingSilentRoll, executeRoll]);

  const handleCancelSneak = useCallback(() => {
    if (!pendingSilentRoll) return;
    executeRoll(pendingSilentRoll, 0);
    setPendingSilentRoll(null);
  }, [pendingSilentRoll, executeRoll]);

  const handleReroll = useCallback((rollId: number, dieIndex: number) => {
    setHistory(prev => prev.map(r => {
      if (r.id !== rollId) return r;
      const newDice = [...r.dice];
      const wasSneakDie = newDice[dieIndex].isSneakDie;
      const newDie = rollSingleDie(r.threshold);
      newDie.rerolled = true;
      newDie.isSneakDie = wasSneakDie;
      newDice[dieIndex] = newDie;
      const stats = computeResults(newDice);
      const dmg = calculateDamage(stats.netSuccesses, stats.totalCrits, r.damageInfo, r.convertedToEffects);
      return { ...r, dice: newDice, ...stats, damageOutput: dmg };
    }));
  }, []);

  const handleConvertEffect = useCallback((rollId: number, delta: number) => {
    setHistory(prev => prev.map(r => {
      if (r.id !== rollId) return r;
      const newConverted = Math.max(0, Math.min(r.netSuccesses, r.convertedToEffects + delta));
      const dmg = calculateDamage(r.netSuccesses, r.totalCrits, r.damageInfo, newConverted);
      return { ...r, convertedToEffects: newConverted, damageOutput: dmg };
    }));
  }, []);

  return (
    <DiceRollerContext.Provider value={{ rollDice, openRoller: () => setIsOpen(true), closeRoller: () => setIsOpen(false), isOpen, onSkulkSpent: onSkulkSpentRef }}>
      {children}
      <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setPendingSilentRoll(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto" data-testid="dice-roller-drawer">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2 text-primary" style={{ fontFamily: "var(--font-display)" }}>
              <Dices className="w-5 h-5" />
              Dice Roller
            </SheetTitle>
            <SheetDescription>Roll d20 pools. 11+ = success, 18-20 = crit (2 hits), 1-3 = subtract. Click dice to reroll.</SheetDescription>
          </SheetHeader>

          {pendingSilentRoll && (
            <SneakAttackPanel
              pendingRoll={pendingSilentRoll}
              onRoll={handleSneakRoll}
              onCancel={handleCancelSneak}
            />
          )}

          {!pendingSilentRoll && (
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
                onClick={() => rollDice({ poolSize: manualPool, label: manualLabel, threshold: manualThreshold })}
                data-testid="button-roll-dice"
              >
                <Dices className="w-4 h-4 mr-2" /> Roll {manualPool}d20
              </Button>
            </Card>
          )}

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Roll History</span>
            {history.length > 0 && (
              <Button size="icon" variant="ghost" onClick={() => setHistory([])} data-testid="button-clear-history">
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {history.map(r => (
              <RollResultDisplay
                key={r.id}
                result={r}
                onReroll={handleReroll}
                onConvertEffect={handleConvertEffect}
              />
            ))}
            {history.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No rolls yet. Roll some dice!</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </DiceRollerContext.Provider>
  );
}

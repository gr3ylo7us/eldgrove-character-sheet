import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getRule } from "@/lib/rules";
import { BookOpen } from "lucide-react";

interface RulesTooltipProps {
  ruleKey: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function RulesTooltip({ ruleKey, children, side = "top", className }: RulesTooltipProps) {
  const rule = getRule(ruleKey);
  if (!rule) return <>{children}</>;

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <span className={`cursor-help border-b border-dotted border-muted-foreground/40 ${className ?? ""}`} data-testid={`tooltip-trigger-${ruleKey}`}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs p-0 border-primary/30" data-testid={`tooltip-content-${ruleKey}`}>
        <div className="p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-primary/60 shrink-0" />
            <span className="text-xs font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>{rule.title}</span>
          </div>
          {rule.category && (
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{rule.category}</span>
          )}
          {rule.formula && (
            <div className="bg-secondary/50 rounded px-2 py-1 text-xs font-mono text-primary/80">
              {rule.formula}
            </div>
          )}
          <p className="text-xs leading-relaxed text-popover-foreground/90">{rule.description}</p>
          {rule.usage && (
            <p className="text-[11px] leading-relaxed text-muted-foreground italic">{rule.usage}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

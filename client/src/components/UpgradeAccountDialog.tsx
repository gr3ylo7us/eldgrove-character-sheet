import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpCircle, Key, Loader2 } from "lucide-react";

export function UpgradeAccountDialog() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    
    setIsRedeeming(true);
    try {
      const res = await fetch("/api/keys/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: "Account Upgraded!", description: data.message });
        setOpen(false);
        setKey("");
        // Force re-fetch the user so the UI updates
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } else {
        toast({ title: "Upgrade Failed", description: data.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Network Error", description: "Could not reach the server.", variant: "destructive" });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-secondary text-secondary-foreground hover:bg-secondary/10 ml-2">
          <ArrowUpCircle className="w-4 h-4 mr-2" /> Upgrade to GM
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary text-center">Unlock GM Access</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Enter a Game Master Beta Key to unlock campaign creation and GM tools.
            </p>
            <div className="space-y-2">
              <Label className="font-display text-muted-foreground flex items-center gap-2">
                <Key className="w-4 h-4" /> Access Key
              </Label>
              <Input 
                value={key} 
                onChange={(e) => setKey(e.target.value)} 
                className="font-mono text-center tracking-widest uppercase bg-background" 
                placeholder="ELDG-XXXX-XXXX-XXXX" 
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              disabled={isRedeeming || !key.trim()}
              className="bg-primary text-primary-foreground font-display hover:bg-primary/90"
            >
              {isRedeeming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isRedeeming ? "Upgrading..." : "Redeem Key"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

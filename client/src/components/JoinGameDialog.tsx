import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useJoinGame } from "@/hooks/use-games";
import { Users } from "lucide-react";

export function JoinGameDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const { mutate, isPending } = useJoinGame();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    mutate({ inviteCode: code.toUpperCase() }, {
      onSuccess: () => {
        setOpen(false);
        setCode("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-secondary text-secondary-foreground hover:bg-secondary">
          <Users className="w-4 h-4 mr-2" /> Join Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary text-center">Join Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-display text-muted-foreground">Invite Code</Label>
              <Input 
                value={code} 
                onChange={(e) => setCode(e.target.value.toUpperCase())} 
                className="fantasy-input text-center font-mono tracking-widest text-lg uppercase" 
                placeholder="XXXXXX" 
                maxLength={6}
                autoFocus
              />
            </div>
            <p className="text-sm text-center text-muted-foreground italic">Ask your Game Master for the 6-character invite code.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              disabled={isPending || code.length < 6}
              className="bg-primary text-primary-foreground font-display hover:bg-primary/90"
            >
              {isPending ? "Connecting..." : "Join Game"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateGame } from "@/hooks/use-games";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export function CreateGameDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { mutate, isPending } = useCreateGame();
  const { toast } = useToast();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutate({ name }, {
      onSuccess: () => {
        setOpen(false);
        setName("");
        toast({ title: "Campaign Created", description: "Your new campaign awaits!" });
      },
      onError: (err: any) => {
        toast({ title: "Failed to create campaign", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
          <Plus className="w-4 h-4 mr-2" /> Start Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary text-center">New Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-display text-muted-foreground">Campaign Title</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="fantasy-input" 
                placeholder="The Crystal Spire..." 
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              disabled={isPending || !name.trim()}
              className="bg-primary text-primary-foreground font-display hover:bg-primary/90"
            >
              {isPending ? "Inscribing..." : "Create Game"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCharacterSchema, type InsertCharacter } from "@shared/schema";
import { useCreateCharacter } from "@/hooks/use-characters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Sword } from "lucide-react";

const defaultStats = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10
};

export function CreateCharDialog() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateCharacter();
  
  const form = useForm<InsertCharacter>({
    resolver: zodResolver(insertCharacterSchema),
    defaultValues: {
      name: "",
      race: "",
      class: "",
      level: 1,
      stats: defaultStats,
      skills: [],
      equipment: [],
      abilities: [],
      notes: "",
      isNpc: false,
    }
  });

  const onSubmit = (data: InsertCharacter) => {
    mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="fantasy-button bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-16 w-16 shadow-lg shadow-primary/20">
          <Sword className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary text-center">New Legend</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-display text-muted-foreground">Name</Label>
              <Input {...form.register("name")} className="fantasy-input" placeholder="Aragorn..." />
              {form.formState.errors.name && <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-display text-muted-foreground">Race</Label>
                <Input {...form.register("race")} className="fantasy-input" placeholder="Human" />
              </div>
              <div className="space-y-2">
                <Label className="font-display text-muted-foreground">Class</Label>
                <Input {...form.register("class")} className="fantasy-input" placeholder="Ranger" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-display text-muted-foreground">Starting Level</Label>
              <Input 
                type="number" 
                {...form.register("level", { valueAsNumber: true })} 
                className="fantasy-input" 
                min={1} 
                max={20}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              disabled={isPending}
              className="bg-primary text-primary-foreground font-display hover:bg-primary/90"
            >
              {isPending ? "Inscribing..." : "Create Hero"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

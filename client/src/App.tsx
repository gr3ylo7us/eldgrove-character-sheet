import { Switch, Route } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { BookOpen, Dices } from "lucide-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CharacterSheet from "@/pages/CharacterSheet";
import Datacard from "@/pages/Datacard";
import Compendium from "@/pages/Compendium";
import { CompendiumDrawer } from "@/components/CompendiumDrawer";
import { DiceRollerProvider, useDiceRoller } from "@/components/DiceRoller";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/character/:id" component={CharacterSheet}/>
      <Route path="/datacard/:id" component={Datacard}/>
      <Route path="/compendium" component={Compendium}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function FloatingButtons() {
  const [compendiumOpen, setCompendiumOpen] = useState(false);
  const { openRoller } = useDiceRoller();

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <Button
          size="icon"
          variant="outline"
          className="rounded-full shadow-lg bg-background/90 backdrop-blur-sm border-primary/30"
          onClick={openRoller}
          data-testid="button-dice-fab"
        >
          <Dices className="w-5 h-5 text-primary" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="rounded-full shadow-lg bg-background/90 backdrop-blur-sm border-primary/30"
          onClick={() => setCompendiumOpen(true)}
          data-testid="button-compendium-fab"
        >
          <BookOpen className="w-5 h-5 text-primary" />
        </Button>
      </div>
      <CompendiumDrawer open={compendiumOpen} onOpenChange={setCompendiumOpen} />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DiceRollerProvider>
          <Router />
          <FloatingButtons />
          <Toaster />
        </DiceRollerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

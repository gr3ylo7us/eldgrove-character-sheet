import { Switch, Route } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CharacterSheet from "@/pages/CharacterSheet";
import Datacard from "@/pages/Datacard";
import Compendium from "@/pages/Compendium";
import { CompendiumDrawer } from "@/components/CompendiumDrawer";

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

function App() {
  const [compendiumOpen, setCompendiumOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Button
          size="icon"
          variant="outline"
          className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg bg-background/90 backdrop-blur-sm border-primary/30"
          onClick={() => setCompendiumOpen(true)}
          data-testid="button-compendium-fab"
        >
          <BookOpen className="w-5 h-5 text-primary" />
        </Button>
        <CompendiumDrawer open={compendiumOpen} onOpenChange={setCompendiumOpen} />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

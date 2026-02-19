import { Switch, Route } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { BookOpen, Dices } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import CreateCharacter from "@/pages/CreateCharacter";
import CharacterSheet from "@/pages/CharacterSheet";
import Datacard from "@/pages/Datacard";
import Compendium from "@/pages/Compendium";
import AccessGate from "@/pages/AccessGate";
import Admin from "@/pages/Admin";
import { CompendiumDrawer } from "@/components/CompendiumDrawer";
import { DiceRollerProvider, useDiceRoller } from "@/components/DiceRoller";

function AuthRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground italic" style={{ fontFamily: "var(--font-display)" }}>
            Consulting the archives...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/compendium" component={Compendium} />
        <Route>
          <Landing />
        </Route>
      </Switch>
    );
  }

  // Free-tier users see the access gate (except on /admin which handles its own auth)
  if (user.accessTier === "free") {
    return (
      <Switch>
        <Route path="/admin" component={Admin} />
        <Route path="/compendium" component={Compendium} />
        <Route>
          <AccessGate />
        </Route>
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create" component={CreateCharacter} />
      <Route path="/character/:id" component={CharacterSheet} />
      <Route path="/datacard/:id" component={Datacard} />
      <Route path="/compendium" component={Compendium} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function FloatingButtons() {
  const [compendiumOpen, setCompendiumOpen] = useState(false);
  const { openRoller } = useDiceRoller();
  const { user } = useAuth();

  if (!user) return null;

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
          <AuthRouter />
          <FloatingButtons />
          <Toaster />
        </DiceRollerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

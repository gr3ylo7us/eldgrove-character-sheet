import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Scroll, Shield, Swords, Sparkles, Users, BookOpen } from "lucide-react";
import heroImage from "@/assets/images/landing-hero.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/20 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 gap-4 flex-wrap">
          <h1
            className="text-xl text-primary tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
            data-testid="text-app-title"
          >
            Eldgrove Chronicles
          </h1>
          <div className="flex items-center gap-3">
            <a href="/compendium">
              <Button variant="ghost" data-testid="link-landing-compendium">
                <BookOpen className="w-4 h-4 mr-2" /> Compendium
              </Button>
            </a>
            <a href="/api/login">
              <Button data-testid="button-login">Sign In</Button>
            </a>
          </div>
        </div>
      </nav>

      <section className="relative pt-16 overflow-hidden">
        <div className="relative h-[70vh] min-h-[480px]">
          <img
            src={heroImage}
            alt="The ancient groves of Eldgrove"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />

          <div className="relative z-10 flex flex-col justify-end h-full max-w-6xl mx-auto px-4 pb-12 md:pb-16">
            <div className="max-w-xl space-y-5">
              <p
                className="text-sm uppercase tracking-[0.3em] text-primary/80"
                style={{ fontFamily: "var(--font-display)" }}
              >
                A Tabletop Roleplaying Game
              </p>
              <h2
                className="text-4xl md:text-6xl leading-tight text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
                data-testid="text-hero-title"
              >
                Forge Your Legend in the Groves
              </h2>
              <p
                className="text-lg md:text-xl text-foreground/80 leading-relaxed"
                style={{ fontFamily: "var(--font-body)" }}
              >
                A classless, d20-pool system where every choice shapes your destiny.
                Nine stats, ancient martial arts, arcane languages, and a world
                that remembers your name.
              </p>
              <div className="flex gap-3 pt-2 flex-wrap">
                <a href="/api/login">
                  <Button size="lg" data-testid="button-get-started">
                    <Scroll className="w-4 h-4 mr-2" /> Begin Your Chronicle
                  </Button>
                </a>
                <a href="/compendium">
                  <Button variant="outline" size="lg" className="bg-background/30 backdrop-blur-sm" data-testid="button-browse-compendium">
                    Browse the Compendium
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h3
              className="text-2xl md:text-3xl text-primary"
              style={{ fontFamily: "var(--font-display)" }}
            >
              What Awaits You
            </h3>
            <p className="text-muted-foreground max-w-lg mx-auto" style={{ fontFamily: "var(--font-body)" }}>
              Manage your heroes, track your battles, and explore the lore of Eldgrove.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-3 hover-elevate" data-testid="card-feature-sheets">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h4 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Character Sheets
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                Comprehensive character management with full stat tracking, wound progression,
                SEELE resources, and SKULK stealth mechanics.
              </p>
            </Card>

            <Card className="p-6 space-y-3 hover-elevate" data-testid="card-feature-combat">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Swords className="w-5 h-5 text-primary" />
              </div>
              <h4 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Combat Datacards
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                Quick-reference combat and roleplay views with integrated d20 pool dice rolling,
                weapon attacks, spell casting, and sneak attack tracking.
              </p>
            </Card>

            <Card className="p-6 space-y-3 hover-elevate" data-testid="card-feature-compendium">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <h4 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Full Compendium
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                Searchable reference library of weapons, armor, skills, feats, maneuvers,
                martial arts, arcane languages, and archetypes.
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-3 hover-elevate" data-testid="card-feature-wizard">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h4 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Creation Wizard
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                Step-by-step guided character creation with mix-and-match archetype features,
                auto-populated skills, and quick-generate roles for instant heroes.
              </p>
            </Card>

            <Card className="p-6 space-y-3 hover-elevate" data-testid="card-feature-accounts">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h4 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Personal Collection
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                Sign in with Google to save your characters. Your collection is private
                and accessible from any device, wherever the road takes you.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/20 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p style={{ fontFamily: "var(--font-display)" }} className="text-xs tracking-wide">
            Eldgrove Chronicles
          </p>
          <p style={{ fontFamily: "var(--font-body)" }}>
            A companion tool for the Eldgrove tabletop roleplaying game.
          </p>
        </div>
      </footer>
    </div>
  );
}

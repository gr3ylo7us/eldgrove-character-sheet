# Eldgrove Character Sheet

## Overview
Web-based character sheet application for the "Eldgrove" TTRPG system. Displays character information in two main formats:
- **Character Sheet**: Comprehensive view for editing all character details (stats, combat, skills, abilities, inventory)
- **Datacards**: Streamlined Combat and Roleplay views for quick reference during gameplay
- **Compendium**: Reference library for all game data (weapons, armor, items, skills, feats, maneuvers, languages, archetypes, leveling) with clickable detail dialogs

## Architecture
- **Frontend**: React + TypeScript + Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js with Drizzle ORM
- **Database**: PostgreSQL (Neon-backed via Replit)
- **Routing**: wouter for client-side routing

## Project Structure
```
client/src/
  pages/
    Home.tsx          - Character list, create/delete characters
    CharacterSheet.tsx - Full editor with tabs: Stats, Combat, Skills, Abilities, Inventory
    Datacard.tsx       - Combat & Roleplay datacards for quick gameplay reference
    Compendium.tsx     - Reference library for all game data
  hooks/
    use-characters.ts  - Character CRUD hooks
    use-game-data.ts   - Reference data query hooks
  lib/
    formulas.ts        - Game mechanic calculations (derived stats, weapon attacks, spell casting)
server/
  routes.ts   - All API routes for characters + reference data
  storage.ts  - Database storage interface
  seed.ts     - CSV parser and database seeder
  db.ts       - Database connection
shared/
  schema.ts   - All Drizzle table schemas + Zod insert schemas + types
  routes.ts   - Route definitions
data/csv/     - Source CSV files for game reference data
```

## Key Game Mechanics
- 6 core stats: Power, Finesse, Vitality, Acumen, Diplomacy, Intuition
- Derived attributes: Reflexes, Seek, Nerve, Health, Will, Aptitude, Move, Evade, Skulk
- Seele resource system (max = VIT + DIP + INT + ACU)
- Woundscale progression tracking
- Weapon attack = weapon dice + mastery tier + attacks
- Spell cast = arcane mastery + language difficulty

## Design
- Dark fantasy RPG aesthetic
- Fonts: Cinzel (headers), Crimson Text (body)
- Gold accents on dark backgrounds
- Color scheme defined in index.css with HSL variables

## Recent Changes
- Feb 2026: Complete rebuild with full reference data system
- Seeded from 10 CSV files: weapons, armor, items, skills, feats, maneuvers, archetypes, languages, leveling
- Sample character "Ashren Voss" pre-loaded
- Feb 2026: Added Archetypes support
  - Archetypes tab in Compendium showing 25 archetypes across 3 tiers (Initiate, Acolyte, Scholar)
  - Clickable detail dialogs for all Compendium items
  - Fixed CSV parser to handle multi-line quoted fields
- Feb 2026: Major UI overhaul
  - Wound healthbar: Visual bar with color-coded Woundscale progression (Uninjured -> Death's Door)
  - Skulk tracker: Rollable max/current system with "Set Max" button and progress bar
  - Multi-archetype system: Classless design - add multiple archetypes with per-feature checkboxes
  - Addable skills: Skills tab uses add/remove workflow instead of full list
  - Seele bar: Visual progress bar for current/max Seele
  - Icons throughout: Stat icons (Flame, Heart, Brain, etc.), section headers, weapon badges
  - Schema additions: skulkMax, skulkCurrent, selectedArchetypes fields

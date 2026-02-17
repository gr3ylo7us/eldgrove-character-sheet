
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { characters } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.characters.list.path, async (req, res) => {
    const chars = await storage.getCharacters();
    res.json(chars);
  });

  app.get(api.characters.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const char = await storage.getCharacter(id);
    if (!char) return res.status(404).json({ message: "Character not found" });
    
    res.json(char);
  });

  app.post(api.characters.create.path, async (req, res) => {
    try {
      const charData = api.characters.create.input.parse(req.body);
      const char = await storage.createCharacter(charData);
      res.status(201).json(char);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors });
      }
      throw e;
    }
  });

  app.put(api.characters.update.path, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    try {
      const charData = api.characters.update.input.parse(req.body);
      const updated = await storage.updateCharacter(id, charData);
      if (!updated) return res.status(404).json({ message: "Character not found" });
      res.json(updated);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors });
      }
      throw e;
    }
  });

  app.delete(api.characters.delete.path, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    await storage.deleteCharacter(id);
    res.status(204).send();
  });

  return httpServer;
}

// Seed function to populate DB with example characters
async function seedDatabase() {
  const existing = await storage.getCharacters();
  if (existing.length === 0) {
    const defaultStats = {
      strength: 16,
      dexterity: 14,
      constitution: 15,
      intelligence: 10,
      wisdom: 12,
      charisma: 8
    };
    
    await storage.createCharacter({
      name: "Grommash",
      race: "Orc",
      class: "Barbarian",
      level: 3,
      stats: defaultStats,
      notes: "A fierce warrior looking for his clan.",
      skills: ["Athletics", "Intimidation"],
      equipment: ["Greataxe", "Potion of Healing"],
      abilities: ["Rage", "Reckless Attack"]
    });
    
    await storage.createCharacter({
      name: "Elara",
      race: "Elf",
      class: "Wizard",
      level: 3,
      stats: { ...defaultStats, strength: 8, intelligence: 18 },
      notes: "Studying ancient runes.",
      skills: ["Arcana", "History"],
      equipment: ["Spellbook", "Wand"],
      abilities: ["Fireball", "Mage Armor"]
    });
  }
}

// Invoke seed (fire and forget)
seedDatabase().catch(console.error);

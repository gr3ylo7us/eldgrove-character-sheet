import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { seedDatabase } from "./seed";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await setupAuth(app);
  registerAuthRoutes(app);

  await seedDatabase();

  app.get(api.characters.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    res.json(await storage.getCharactersByUser(userId));
  });

  app.get(api.characters.get.path, isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const userId = req.user.claims.sub;
    const char = await storage.getCharacterForUser(id, userId);
    if (!char) return res.status(404).json({ message: "Character not found" });
    res.json(char);
  });

  app.post(api.characters.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = api.characters.create.input.parse(req.body);
      const char = await storage.createCharacter({ ...data, userId });
      res.status(201).json(char);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      throw e;
    }
  });

  app.put(api.characters.update.path, isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const userId = req.user.claims.sub;
    try {
      const data = api.characters.update.input.parse(req.body);
      const updated = await storage.updateCharacterForUser(id, userId, data);
      if (!updated) return res.status(404).json({ message: "Character not found" });
      res.json(updated);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      throw e;
    }
  });

  app.delete(api.characters.delete.path, isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const userId = req.user.claims.sub;
    await storage.deleteCharacterForUser(id, userId);
    res.status(204).send();
  });

  app.get(api.data.weapons.path, async (_req, res) => res.json(await storage.getWeapons()));
  app.get(api.data.armor.path, async (_req, res) => res.json(await storage.getArmor()));
  app.get(api.data.items.path, async (_req, res) => res.json(await storage.getItems()));
  app.get(api.data.skills.path, async (_req, res) => res.json(await storage.getSkills()));
  app.get(api.data.archetypes.path, async (_req, res) => res.json(await storage.getArchetypes()));
  app.get(api.data.feats.path, async (_req, res) => res.json(await storage.getFeats()));
  app.get(api.data.maneuvers.path, async (_req, res) => res.json(await storage.getManeuvers()));
  app.get(api.data.languages.path, async (_req, res) => res.json(await storage.getLanguages()));
  app.get(api.data.leveling.path, async (_req, res) => res.json(await storage.getLeveling()));

  return httpServer;
}

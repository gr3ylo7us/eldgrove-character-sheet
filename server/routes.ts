import express from "express";
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { seedDatabase } from "./seed";
import { setupAuth, registerAuthRoutes, isAuthenticated, hasPaidAccess } from "./replit_integrations/auth";
import { registerStripeRoutes } from "./stripe";
import { registerPatreonRoutes } from "./patreon";
import crypto from 'crypto';

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Stripe webhook needs raw body — register BEFORE express.json()
  app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));

  await setupAuth(app);
  registerAuthRoutes(app);
  registerStripeRoutes(app);
  registerPatreonRoutes(app);

  await seedDatabase();

  // Character routes — require paid access
  app.get(api.characters.list.path, hasPaidAccess, async (req: any, res) => {
    const userId = req.session.userId;
    res.json(await storage.getCharactersByUser(userId));
  });

  app.get(api.characters.get.path, hasPaidAccess, async (req: any, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const userId = req.session.userId;
    const char = await storage.getCharacterForUser(id, userId);
    if (!char) return res.status(404).json({ message: "Character not found" });
    res.json(char);
  });

  app.post(api.characters.create.path, hasPaidAccess, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = api.characters.create.input.parse(req.body);
      const char = await storage.createCharacter({ ...data, userId });
      res.status(201).json(char);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      throw e;
    }
  });

  app.put(api.characters.update.path, hasPaidAccess, async (req: any, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const userId = req.session.userId;
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

  app.delete(api.characters.delete.path, hasPaidAccess, async (req: any, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const userId = req.session.userId;
    await storage.deleteCharacterForUser(id, userId);
    res.status(204).send();
  });

  // Game/VTT Routes
  app.get(api.games.list.path, hasPaidAccess, async (req: any, res) => {
    const userId = req.session.userId;
    res.json(await storage.getGamesForUser(userId));
  });

  app.post(api.games.create.path, hasPaidAccess, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = api.games.create.input.parse(req.body);
      const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 char code
      const game = await storage.createGame({ name: data.name, inviteCode, ownerId: userId });
      // Add creator as GM
      await storage.joinGame({ gameId: game.id, userId, role: 'gm' });
      res.status(201).json(game);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      throw e;
    }
  });

  app.get(api.games.get.path, hasPaidAccess, async (req: any, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const game = await storage.getGame(id);
    if (!game) return res.status(404).json({ message: "Game not found" });
    res.json(game);
  });

  app.post(api.games.join.path, hasPaidAccess, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = api.games.join.input.parse(req.body);
      const game = await storage.getGameByInviteCode(data.inviteCode);
      if (!game) return res.status(404).json({ message: "Invalid invite code" });

      // Check if already in game
      const members = await storage.getGameMembers(game.id);
      if (members.some(m => m.userId === userId)) {
        return res.json(game); // Already joined, just return the game object
      }

      await storage.joinGame({ gameId: game.id, userId, role: 'player' });
      res.json(game);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      throw e;
    }
  });

  app.get(api.games.getMembers.path, hasPaidAccess, async (req: any, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    res.json(await storage.getGameMembers(id));
  });

  app.put(api.games.updateMember.path, hasPaidAccess, async (req: any, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const userId = req.session.userId;
    try {
      const data = api.games.updateMember.input.parse(req.body);
      await storage.updateGameMemberCharacter(id, userId, data.characterId);
      res.json({ success: true });
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      throw e;
    }
  });

  // Game data routes — public (needed for Compendium)
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

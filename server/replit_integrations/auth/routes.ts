import type { Express } from "express";
import express from "express";
import fs from "fs";
import path from "path";
import { authStorage } from "./storage";
import { isAuthenticated, isAdmin } from "./replitAuth";

const ADMIN_EMAILS = [
  "dusanrakicarc@gmail.com",
  ...(process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean),
];

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user (includes access tier)
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      let user = await authStorage.getUser(userId);
      // Auto-fix: ensure admin emails always have admin tier
      if (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()) && user.accessTier !== "admin") {
        user = await authStorage.updateUserTier(userId, "admin") || user;
        console.log(`[Auth] Auto-fixed ${user.email} to admin tier via /api/auth/user`);
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // DEBUG: temporary endpoint to check admin email matching
  app.get("/api/debug/whoami", isAuthenticated, async (req, res) => {
    const userId = req.session.userId!;
    const user = await authStorage.getUser(userId);
    res.json({
      userId,
      email: user?.email,
      accessTier: user?.accessTier,
      adminEmailsEnv: process.env.ADMIN_EMAILS || "(not set)",
      adminEmailsParsed: ADMIN_EMAILS,
      emailMatch: user?.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false,
    });
  });

  // Redeem an access key
  app.post("/api/keys/redeem", isAuthenticated, async (req: any, res) => {
    const { key } = req.body;
    if (!key) return res.status(400).json({ message: "Key is required" });

    const result = await authStorage.redeemAccessKey(key, req.session.userId!);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  });

  // Admin: Generate access key
  app.post("/api/admin/keys/generate", isAdmin, async (_req, res) => {
    try {
      const key = await authStorage.generateAccessKey();
      res.json(key);
    } catch (error) {
      console.error("Error generating key:", error);
      res.status(500).json({ message: "Failed to generate key" });
    }
  });

  // Admin: List all access keys
  app.get("/api/admin/keys", isAdmin, async (_req, res) => {
    try {
      const keys = await authStorage.listAccessKeys();
      res.json(keys);
    } catch (error) {
      console.error("Error listing keys:", error);
      res.status(500).json({ message: "Failed to list keys" });
    }
  });

  // Admin: Get list of reseedable table names
  app.get("/api/admin/tables", isAdmin, async (_req, res) => {
    const { RESEEDABLE_TABLES } = await import("../../seed");
    res.json({ tables: RESEEDABLE_TABLES });
  });

  // Admin: Re-seed ALL game data tables from CSV files on disk
  app.post("/api/admin/reseed", isAdmin, async (_req, res) => {
    try {
      const { reseedAll } = await import("../../seed");
      const result = await reseedAll();
      res.json({ message: "All game data re-seeded successfully", ...result });
    } catch (error: any) {
      console.error("Error re-seeding:", error);
      res.status(500).json({ message: `Re-seed failed: ${error.message}` });
    }
  });

  // Admin: Re-seed a single table from its CSV on disk
  app.post("/api/admin/reseed/:table", isAdmin, async (req, res) => {
    try {
      const { reseedTable } = await import("../../seed");
      const result = await reseedTable(req.params.table as string);
      res.json({ message: `${req.params.table} re-seeded successfully`, ...result });
    } catch (error: any) {
      console.error("Error re-seeding table:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Admin: Upload CSV content for a specific table and re-seed it
  app.post("/api/admin/upload-csv/:table", isAdmin, express.text({ type: "*/*", limit: "5mb" }), async (req, res) => {
    try {
      const csvContent = req.body as string;
      if (!csvContent || csvContent.length < 10) {
        return res.status(400).json({ message: "CSV content is empty or too short" });
      }
      const { reseedFromContent } = await import("../../seed");
      const result = await reseedFromContent(req.params.table as string, csvContent);
      res.json({ message: `${req.params.table} updated from uploaded CSV`, ...result });
    } catch (error: any) {
      console.error("Error uploading CSV:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // --- Google Sheet URL persistence ---
  const configPath = path.join(process.cwd(), "data", "admin-config.json");

  function loadConfig(): Record<string, string> {
    try { return JSON.parse(fs.readFileSync(configPath, "utf-8")); } catch { return {}; }
  }
  function saveConfig(config: Record<string, string>) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  }

  // Admin: Get saved Google Sheet URL
  app.get("/api/admin/sheet-url", isAdmin, (_req, res) => {
    const config = loadConfig();
    res.json({ sheetUrl: config.sheetUrl || "" });
  });

  // Admin: Save Google Sheet URL
  app.put("/api/admin/sheet-url", isAdmin, (req, res) => {
    const { sheetUrl } = req.body;
    const config = loadConfig();
    config.sheetUrl = sheetUrl || "";
    saveConfig(config);
    res.json({ message: "Sheet URL saved.", sheetUrl: config.sheetUrl });
  });

  // Admin: Sync all game data from a published Google Sheet
  app.post("/api/admin/sync-sheets", isAdmin, async (req, res) => {
    try {
      const { sheetId } = req.body;
      if (!sheetId || typeof sheetId !== "string" || sheetId.length < 10) {
        return res.status(400).json({ message: "A valid Google Sheet ID is required." });
      }

      // Auto-save the URL for future syncs
      const config = loadConfig();
      config.sheetUrl = sheetId;
      saveConfig(config);

      const { syncFromGoogleSheet } = await import("../../seed");
      const result = await syncFromGoogleSheet(sheetId);

      const failed = result.results.filter(r => r.count === -1);
      if (failed.length > 0) {
        return res.json({
          message: `Sync completed with ${failed.length} tab(s) failing. Check server logs.`,
          ...result,
        });
      }

      res.json({ message: "All game data synced from Google Sheets!", ...result });
    } catch (error: any) {
      console.error("Error syncing from Google Sheets:", error);
      res.status(500).json({ message: `Sync failed: ${error.message}` });
    }
  });
}

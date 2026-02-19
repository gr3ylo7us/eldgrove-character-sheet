import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated, isAdmin } from "./replitAuth";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

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
}

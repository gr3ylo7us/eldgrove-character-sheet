import { users, accessKeys, type User, type UpsertUser, type AccessKey } from "@shared/models/auth";
import { db } from "../../db";
import { eq, isNull } from "drizzle-orm";
import crypto from "crypto";

// Interface for auth storage operations
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserTier(userId: string, tier: string, extra?: Partial<UpsertUser>): Promise<User | undefined>;
  // Access key operations
  generateAccessKey(type?: string): Promise<AccessKey>;
  listAccessKeys(): Promise<AccessKey[]>;
  redeemAccessKey(key: string, userId: string): Promise<{ success: boolean; message: string }>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // SQLite upsert: try insert, on conflict update
    const existing = await this.getUser(userData.id!);
    if (existing) {
      // Only update profile fields, NEVER overwrite accessTier or payment fields
      await db
        .update(users)
        .set({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id!));
      return (await this.getUser(userData.id!))!;
    } else {
      await db.insert(users).values({
        ...userData,
        accessTier: userData.accessTier || "free",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return (await this.getUser(userData.id!))!;
    }
  }

  async updateUserTier(userId: string, tier: string, extra?: Partial<UpsertUser>): Promise<User | undefined> {
    await db
      .update(users)
      .set({ accessTier: tier, ...extra, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return this.getUser(userId);
  }

  async generateAccessKey(type: string = "beta"): Promise<AccessKey> {
    // Generate a readable key like "ELDG-XXXX-XXXX-XXXX"
    const segments = Array.from({ length: 3 }, () =>
      crypto.randomBytes(2).toString("hex").toUpperCase()
    );
    const key = `ELDG-${segments.join("-")}`;

    const result = await db
      .insert(accessKeys)
      .values({ key, type, createdAt: new Date() })
      .returning();
    return result[0];
  }

  async listAccessKeys(): Promise<AccessKey[]> {
    return db.select().from(accessKeys);
  }

  async redeemAccessKey(key: string, userId: string): Promise<{ success: boolean; message: string }> {
    const [found] = await db.select().from(accessKeys).where(eq(accessKeys.key, key.toUpperCase().trim()));
    if (!found) {
      return { success: false, message: "Invalid access key" };
    }
    if (found.redeemedBy) {
      return { success: false, message: "This key has already been redeemed" };
    }

    // Redeem the key
    await db
      .update(accessKeys)
      .set({ redeemedBy: userId, redeemedAt: new Date() })
      .where(eq(accessKeys.key, key.toUpperCase().trim()));

    // Upgrade user to beta or gm based on key type
    const newTier = found.type === "gm" ? "gm" : "beta";
    await this.updateUserTier(userId, newTier, { accessKeyUsed: key });

    const roleName = newTier === "gm" ? "Game Master" : "Player Beta";
    return { success: true, message: `Access key redeemed! You now have ${roleName} access.` };
  }
}

export const authStorage = new AuthStorage();

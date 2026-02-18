import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Session storage table.
export const sessions = sqliteTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess", { mode: "json" }).notNull(),
  expire: integer("expire").notNull(),
});

// User storage table.
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  // Access control
  accessTier: text("access_tier").default("free"), // 'free' | 'standard' | 'patron' | 'admin'
  stripeCustomerId: text("stripe_customer_id"),
  patreonId: text("patreon_id"),
  accessKeyUsed: text("access_key_used"),
  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// Access keys for free upgrades
export const accessKeys = sqliteTable("access_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  redeemedBy: text("redeemed_by"),
  redeemedAt: integer("redeemed_at", { mode: "timestamp" }),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type AccessKey = typeof accessKeys.$inferSelect;
export type InsertAccessKey = typeof accessKeys.$inferInsert;

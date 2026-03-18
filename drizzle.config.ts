import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: (process.env.DATABASE_URL ? "turso" : "sqlite") as "turso" | "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:./data/eldgrove.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});

import { createClient } from "@libsql/client";
import path from "path";

async function main() {
  const dbUrl = process.env.DATABASE_URL || (() => {
    const dataDir = path.join(process.cwd(), "data");
    return `file:${path.join(dataDir, "eldgrove.db")}`;
  })();

  try {
    const client = createClient({ 
      url: dbUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN
    });
    await client.execute("DROP INDEX IF EXISTS users_email_unique;");
    await client.execute("DROP INDEX IF EXISTS access_keys_key_unique;");
    await client.execute("DROP INDEX IF EXISTS games_invite_code_unique;");
    console.log("Successfully dropped indexes for drizzle-kit push to succeed.");
  } catch (e) {
    console.log("Skipped or failed index drop: ", e.message);
  }
}
main();

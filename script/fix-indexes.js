import { createClient } from "@libsql/client";

async function main() {
  try {
    const client = createClient({ url: "file:./data/eldgrove.db" });
    await client.execute("DROP INDEX IF EXISTS users_email_unique;");
    await client.execute("DROP INDEX IF EXISTS access_keys_key_unique;");
    await client.execute("DROP INDEX IF EXISTS games_invite_code_unique;");
    console.log("Successfully dropped indexes for drizzle-kit push to succeed.");
  } catch (e) {
    console.log("Skipped or failed index drop: ", e.message);
  }
}
main();

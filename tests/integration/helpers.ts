import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const connectionString = process.env.DATABASE_URL!;

// TODO: can we get rid of optional values "| null" here?
// E.g. use sentinel or dummy objects?
// or initialize database connection immediately at the module level?
let client: postgres.Sql | null = null;
let db: PostgresJsDatabase<typeof schema> | null = null;

export function getTestDb() {
  if (!client) {
    client = postgres(connectionString);
    db = drizzle(client, { schema });
  }
  return db!;
}

export async function closeTestDb() {
  if (client) {
    await client.end();
    client = null;
    db = null;
  }
}

export interface TestUser {
  userId: string;
  email: string;
}

export function createTestUser(): TestUser {
  const id = randomUUID();
  return {
    userId: id,
    email: `test-${id}@example.com`,
  };
}

export async function cleanTodos(userId: string) {
  const db = getTestDb();
  await db.delete(schema.todos).where(eq(schema.todos.userId, userId));
}

export async function cleanProfiles(userId: string) {
  const db = getTestDb();
  await db.delete(schema.profiles).where(eq(schema.profiles.id, userId));
}

export async function setupTestUser(userId: string, email: string) {
  const db = getTestDb();
  await db
    .insert(schema.profiles)
    .values({ id: userId, email })
    .onConflictDoNothing();
}

export async function teardownTestUser(userId: string) {
  const db = getTestDb();
  await db.delete(schema.todos).where(eq(schema.todos.userId, userId));
  await db.delete(schema.profiles).where(eq(schema.profiles.id, userId));
}

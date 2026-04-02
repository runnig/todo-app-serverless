import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL!;

export function createTestDb() {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

export async function cleanTodos(userId: string) {
  const db = createTestDb();
  await db.delete(schema.todos).where(eq(schema.todos.userId, userId));
}

export async function cleanProfiles(userId: string) {
  const db = createTestDb();
  await db.delete(schema.profiles).where(eq(schema.profiles.id, userId));
}

export const TODOS_API_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
export const TODOS_API_USER_EMAIL = "todos-api-test@example.com";

export const DRIZZLE_REPO_USER_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
export const DRIZZLE_REPO_USER_EMAIL = "drizzle-repo-test@example.com";

export async function setupTestUser(userId: string, email: string) {
  const db = createTestDb();
  await db
    .insert(schema.profiles)
    .values({ id: userId, email })
    .onConflictDoNothing();
}

export async function teardownTestUser(userId: string) {
  const db = createTestDb();
  await db.delete(schema.todos).where(eq(schema.todos.userId, userId));
  await db.delete(schema.profiles).where(eq(schema.profiles.id, userId));
}

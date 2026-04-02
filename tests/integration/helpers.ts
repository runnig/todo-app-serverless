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

export const TEST_USER_ID = "99999999-9999-9999-9999-999999999999";
export const TEST_USER_EMAIL = "test@example.com";

export async function setupTestUser() {
  const db = createTestDb();
  await db
    .insert(schema.profiles)
    .values({ id: TEST_USER_ID, email: TEST_USER_EMAIL })
    .onConflictDoNothing();
}

export async function teardownTestUser() {
  const db = createTestDb();
  await db.delete(schema.todos).where(eq(schema.todos.userId, TEST_USER_ID));
  await db.delete(schema.profiles).where(eq(schema.profiles.id, TEST_USER_ID));
}

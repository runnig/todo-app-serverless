import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  getTestDb,
  closeTestDb,
  setupTestUser,
  teardownTestUser,
  cleanTodos,
  createTestUser,
} from "./helpers";
import { todos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Todo database operations", () => {
  const testUser = createTestUser();

  beforeAll(async () => {
    await setupTestUser(testUser.userId, testUser.email);
  });

  beforeEach(async () => {
    await cleanTodos(testUser.userId);
  });

  afterAll(async () => {
    await teardownTestUser(testUser.userId);
    await closeTestDb();
  });

  it("inserts and retrieves a todo", async () => {
    const db = getTestDb();

    const inserted = (
      await db
        .insert(todos)
        .values({
          userId: testUser.userId,
          title: "DB test todo",
          description: "Test description",
          done: false,
        })
        .returning()
    )[0]!;

    expect(inserted.title).toBe("DB test todo");
    expect(inserted.userId).toBe(testUser.userId);
    expect(inserted.done).toBe(false);

    const retrieved = (
      await db.select().from(todos).where(eq(todos.id, inserted.id))
    )[0]!;

    expect(retrieved.title).toBe("DB test todo");
  });

  it("updates a todo", async () => {
    const db = getTestDb();

    const inserted = (
      await db
        .insert(todos)
        .values({ userId: testUser.userId, title: "Original" })
        .returning()
    )[0]!;

    const updated = (
      await db
        .update(todos)
        .set({ title: "Updated", done: true })
        .where(eq(todos.id, inserted.id))
        .returning()
    )[0]!;

    expect(updated.title).toBe("Updated");
    expect(updated.done).toBe(true);
  });

  it("deletes a todo", async () => {
    const db = getTestDb();

    const inserted = (
      await db
        .insert(todos)
        .values({ userId: testUser.userId, title: "To delete" })
        .returning()
    )[0]!;

    await db.delete(todos).where(eq(todos.id, inserted.id));

    const results = await db
      .select()
      .from(todos)
      .where(eq(todos.id, inserted.id));

    expect(results).toHaveLength(0);
  });

  it("only retrieves todos for a specific user", async () => {
    const db = getTestDb();

    await db
      .insert(todos)
      .values({ userId: testUser.userId, title: "User 1 todo" })
      .returning();

    const userTodos = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, testUser.userId));

    expect(userTodos).toHaveLength(1);
    expect(userTodos[0]!.title).toBe("User 1 todo");
  });
});

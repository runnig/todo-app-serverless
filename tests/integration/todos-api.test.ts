import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  createTestDb,
  setupTestUser,
  teardownTestUser,
  cleanTodos,
  TODOS_API_USER_ID,
  TODOS_API_USER_EMAIL,
} from "./helpers";
import { todos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Todo database operations", () => {
  beforeAll(async () => {
    await setupTestUser(TODOS_API_USER_ID, TODOS_API_USER_EMAIL);
  });

  beforeEach(async () => {
    await cleanTodos(TODOS_API_USER_ID);
  });

  afterAll(async () => {
    await teardownTestUser(TODOS_API_USER_ID);
  });

  it("inserts and retrieves a todo", async () => {
    const db = createTestDb();

    const inserted = (
      await db
        .insert(todos)
        .values({
          userId: TODOS_API_USER_ID,
          title: "DB test todo",
          description: "Test description",
          done: false,
        })
        .returning()
    )[0]!;

    expect(inserted.title).toBe("DB test todo");
    expect(inserted.userId).toBe(TODOS_API_USER_ID);
    expect(inserted.done).toBe(false);

    const retrieved = (
      await db.select().from(todos).where(eq(todos.id, inserted.id))
    )[0]!;

    expect(retrieved.title).toBe("DB test todo");
  });

  it("updates a todo", async () => {
    const db = createTestDb();

    const inserted = (
      await db
        .insert(todos)
        .values({ userId: TODOS_API_USER_ID, title: "Original" })
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
    const db = createTestDb();

    const inserted = (
      await db
        .insert(todos)
        .values({ userId: TODOS_API_USER_ID, title: "To delete" })
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
    const db = createTestDb();

    await db
      .insert(todos)
      .values({ userId: TODOS_API_USER_ID, title: "User 1 todo" })
      .returning();

    const userTodos = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, TODOS_API_USER_ID));

    expect(userTodos).toHaveLength(1);
    expect(userTodos[0]!.title).toBe("User 1 todo");
  });
});

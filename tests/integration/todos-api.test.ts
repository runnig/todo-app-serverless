import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestDb,
  setupTestUser,
  teardownTestUser,
  TEST_USER_ID,
} from "./helpers";
import { todos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Todo database operations", () => {
  beforeAll(async () => {
    await setupTestUser();
  });

  afterAll(async () => {
    await teardownTestUser();
  });

  it("inserts and retrieves a todo", async () => {
    const db = createTestDb();

    const [inserted] = await db
      .insert(todos)
      .values({
        userId: TEST_USER_ID,
        title: "DB test todo",
        description: "Test description",
        done: false,
      })
      .returning();

    expect(inserted.title).toBe("DB test todo");
    expect(inserted.userId).toBe(TEST_USER_ID);
    expect(inserted.done).toBe(false);

    const [retrieved] = await db
      .select()
      .from(todos)
      .where(eq(todos.id, inserted.id));

    expect(retrieved.title).toBe("DB test todo");

    await db.delete(todos).where(eq(todos.id, inserted.id));
  });

  it("updates a todo", async () => {
    const db = createTestDb();

    const [inserted] = await db
      .insert(todos)
      .values({ userId: TEST_USER_ID, title: "Original" })
      .returning();

    const [updated] = await db
      .update(todos)
      .set({ title: "Updated", done: true })
      .where(eq(todos.id, inserted.id))
      .returning();

    expect(updated.title).toBe("Updated");
    expect(updated.done).toBe(true);

    await db.delete(todos).where(eq(todos.id, inserted.id));
  });

  it("deletes a todo", async () => {
    const db = createTestDb();

    const [inserted] = await db
      .insert(todos)
      .values({ userId: TEST_USER_ID, title: "To delete" })
      .returning();

    await db.delete(todos).where(eq(todos.id, inserted.id));

    const results = await db
      .select()
      .from(todos)
      .where(eq(todos.id, inserted.id));

    expect(results).toHaveLength(0);
  });

  it("only retrieves todos for a specific user", async () => {
    const db = createTestDb();

    const [todo1] = await db
      .insert(todos)
      .values({ userId: TEST_USER_ID, title: "User 1 todo" })
      .returning();

    const userTodos = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, TEST_USER_ID));

    expect(userTodos).toHaveLength(1);
    expect(userTodos[0].title).toBe("User 1 todo");

    await db.delete(todos).where(eq(todos.id, todo1.id));
  });
});

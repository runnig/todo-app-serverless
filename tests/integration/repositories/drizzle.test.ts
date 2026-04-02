import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { DrizzleTodoRepository } from "@/lib/repositories/drizzle";
import { setupTestUser, teardownTestUser, TEST_USER_ID } from "../helpers";

describe("DrizzleTodoRepository", () => {
  let repo: DrizzleTodoRepository;
  const otherUserId = "88888888-8888-8888-8888-888888888888";

  beforeAll(async () => {
    await setupTestUser();
    repo = new DrizzleTodoRepository();
  });

  afterAll(async () => {
    await teardownTestUser();
  });

  describe("create", () => {
    it("creates a todo in the database", async () => {
      const todo = await repo.create(TEST_USER_ID, {
        title: "Integration test todo",
      });

      expect(todo.id).toBeDefined();
      expect(todo.userId).toBe(TEST_USER_ID);
      expect(todo.title).toBe("Integration test todo");
      expect(todo.done).toBe(false);

      const found = await repo.findById(todo.id, TEST_USER_ID);
      expect(found).not.toBeNull();
      expect(found!.title).toBe("Integration test todo");

      await repo.delete(todo.id, TEST_USER_ID);
    });

    it("creates a todo with description", async () => {
      const todo = await repo.create(TEST_USER_ID, {
        title: "With description",
        description: "Some details",
      });

      expect(todo.description).toBe("Some details");

      await repo.delete(todo.id, TEST_USER_ID);
    });
  });

  describe("findAll", () => {
    it("returns only todos for the given user", async () => {
      const t1 = await repo.create(TEST_USER_ID, { title: "User test 1" });
      const t2 = await repo.create(TEST_USER_ID, { title: "User test 2" });

      const todos = await repo.findAll(TEST_USER_ID);

      expect(todos.length).toBeGreaterThanOrEqual(2);
      const todoIds = todos.map((t) => t.id);
      expect(todoIds).toContain(t1.id);
      expect(todoIds).toContain(t2.id);

      await repo.delete(t1.id, TEST_USER_ID);
      await repo.delete(t2.id, TEST_USER_ID);
    });
  });

  describe("findById", () => {
    it("returns null for todo belonging to another user", async () => {
      const todo = await repo.create(TEST_USER_ID, { title: "Mine" });
      const found = await repo.findById(todo.id, otherUserId);

      expect(found).toBeNull();

      await repo.delete(todo.id, TEST_USER_ID);
    });

    it("returns null for nonexistent id", async () => {
      const found = await repo.findById(
        "00000000-0000-0000-0000-000000000000",
        TEST_USER_ID,
      );
      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("updates title and done status", async () => {
      const created = await repo.create(TEST_USER_ID, { title: "Original" });
      const updated = await repo.update(created.id, TEST_USER_ID, {
        title: "Updated",
        done: true,
      });

      expect(updated).not.toBeNull();
      expect(updated!.title).toBe("Updated");
      expect(updated!.done).toBe(true);
      expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );

      await repo.delete(created.id, TEST_USER_ID);
    });

    it("returns null if todo belongs to another user", async () => {
      const created = await repo.create(TEST_USER_ID, { title: "Mine" });
      const updated = await repo.update(created.id, otherUserId, {
        title: "Hacked",
      });

      expect(updated).toBeNull();

      await repo.delete(created.id, TEST_USER_ID);
    });
  });

  describe("delete", () => {
    it("deletes a todo and returns it", async () => {
      const created = await repo.create(TEST_USER_ID, { title: "Delete me" });
      const deleted = await repo.delete(created.id, TEST_USER_ID);

      expect(deleted).not.toBeNull();
      expect(deleted!.id).toBe(created.id);

      const found = await repo.findById(created.id, TEST_USER_ID);
      expect(found).toBeNull();
    });

    it("returns null if todo belongs to another user", async () => {
      const created = await repo.create(TEST_USER_ID, { title: "Mine" });
      const deleted = await repo.delete(created.id, otherUserId);

      expect(deleted).toBeNull();

      const found = await repo.findById(created.id, TEST_USER_ID);
      expect(found).not.toBeNull();

      await repo.delete(created.id, TEST_USER_ID);
    });
  });
});

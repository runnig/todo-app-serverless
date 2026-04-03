import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { DrizzleTodoRepository } from "@/lib/repositories/drizzle";
import {
  setupTestUser,
  teardownTestUser,
  getTestDb,
  closeTestDb,
  cleanTodos,
  createTestUser,
} from "../helpers";

describe("DrizzleTodoRepository", () => {
  let repo: DrizzleTodoRepository;
  const testUser = createTestUser();
  const otherUserId = "88888888-8888-8888-8888-888888888888";

  beforeAll(async () => {
    await setupTestUser(testUser.userId, testUser.email);
    repo = new DrizzleTodoRepository(getTestDb());
  });

  beforeEach(async () => {
    await cleanTodos(testUser.userId);
  });

  afterAll(async () => {
    await teardownTestUser(testUser.userId);
    await closeTestDb();
  });

  describe("create", () => {
    it("creates a todo in the database", async () => {
      const todo = await repo.create(testUser.userId, {
        title: "Integration test todo",
      });

      expect(todo.id).toBeDefined();
      expect(todo.userId).toBe(testUser.userId);
      expect(todo.title).toBe("Integration test todo");
      expect(todo.done).toBe(false);

      const found = await repo.findById(todo.id, testUser.userId);
      expect(found).not.toBeNull();
      expect(found!.title).toBe("Integration test todo");
    });

    it("creates a todo with description", async () => {
      const todo = await repo.create(testUser.userId, {
        title: "With description",
        description: "Some details",
      });

      expect(todo.description).toBe("Some details");
    });
  });

  describe("findAll", () => {
    it("returns only todos for the given user", async () => {
      const t1 = await repo.create(testUser.userId, {
        title: "User test 1",
      });
      const t2 = await repo.create(testUser.userId, {
        title: "User test 2",
      });

      const todos = await repo.findAll(testUser.userId);

      expect(todos.length).toBeGreaterThanOrEqual(2);
      const todoIds = todos.map((t) => t.id);
      expect(todoIds).toContain(t1.id);
      expect(todoIds).toContain(t2.id);
    });
  });

  describe("findById", () => {
    it("returns null for todo belonging to another user", async () => {
      const todo = await repo.create(testUser.userId, { title: "Mine" });
      const found = await repo.findById(todo.id, otherUserId);

      expect(found).toBeNull();
    });

    it("returns null for nonexistent id", async () => {
      const found = await repo.findById(
        "00000000-0000-0000-0000-000000000000",
        testUser.userId,
      );
      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("updates title and done status", async () => {
      const created = await repo.create(testUser.userId, {
        title: "Original",
      });
      const updated = await repo.update(created.id, testUser.userId, {
        title: "Updated",
        done: true,
      });

      expect(updated).not.toBeNull();
      expect(updated!.title).toBe("Updated");
      expect(updated!.done).toBe(true);
      expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );
    });

    it("returns null if todo belongs to another user", async () => {
      const created = await repo.create(testUser.userId, {
        title: "Mine",
      });
      const updated = await repo.update(created.id, otherUserId, {
        title: "Hacked",
      });

      expect(updated).toBeNull();
    });
  });

  describe("delete", () => {
    it("deletes a todo and returns it", async () => {
      const created = await repo.create(testUser.userId, {
        title: "Delete me",
      });
      const deleted = await repo.delete(created.id, testUser.userId);

      expect(deleted).not.toBeNull();
      expect(deleted!.id).toBe(created.id);

      const found = await repo.findById(created.id, testUser.userId);
      expect(found).toBeNull();
    });

    it("returns null if todo belongs to another user", async () => {
      const created = await repo.create(testUser.userId, {
        title: "Mine",
      });
      const deleted = await repo.delete(created.id, otherUserId);

      expect(deleted).toBeNull();

      const found = await repo.findById(created.id, testUser.userId);
      expect(found).not.toBeNull();
    });
  });
});

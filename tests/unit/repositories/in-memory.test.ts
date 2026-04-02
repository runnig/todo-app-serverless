import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryTodoRepository } from "@/lib/repositories/in-memory";

describe("InMemoryTodoRepository", () => {
  let repo: InMemoryTodoRepository;
  const userId = "user-1";
  const otherUserId = "user-2";

  beforeEach(() => {
    repo = new InMemoryTodoRepository();
  });

  describe("create", () => {
    it("creates a todo and returns it with generated id", async () => {
      const todo = await repo.create(userId, { title: "Buy milk" });

      expect(todo.id).toBeDefined();
      expect(todo.userId).toBe(userId);
      expect(todo.title).toBe("Buy milk");
      expect(todo.description).toBeNull();
      expect(todo.done).toBe(false);
      expect(todo.createdAt).toBeInstanceOf(Date);
      expect(todo.updatedAt).toBeInstanceOf(Date);
    });

    it("creates a todo with description", async () => {
      const todo = await repo.create(userId, {
        title: "Buy milk",
        description: "From the store",
      });

      expect(todo.description).toBe("From the store");
    });
  });

  describe("findAll", () => {
    it("returns only todos for the given user", async () => {
      await repo.create(userId, { title: "User 1 todo" });
      await repo.create(otherUserId, { title: "User 2 todo" });
      await repo.create(userId, { title: "User 1 another todo" });

      const todos = await repo.findAll(userId);

      expect(todos).toHaveLength(2);
      expect(todos.every((t) => t.userId === userId)).toBe(true);
    });

    it("returns todos sorted by createdAt descending", async () => {
      const first = await repo.create(userId, { title: "First" });

      await new Promise((r) => setTimeout(r, 2));
      const second = await repo.create(userId, { title: "Second" });

      const todos = await repo.findAll(userId);

      expect(todos[0].id).toBe(second.id);
      expect(todos[1].id).toBe(first.id);
    });

    it("returns empty array for user with no todos", async () => {
      const todos = await repo.findAll("nonexistent");
      expect(todos).toEqual([]);
    });
  });

  describe("findById", () => {
    it("returns the todo if it belongs to the user", async () => {
      const created = await repo.create(userId, { title: "Find me" });
      const found = await repo.findById(created.id, userId);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it("returns null if todo belongs to another user", async () => {
      const created = await repo.create(userId, { title: "Mine" });
      const found = await repo.findById(created.id, otherUserId);

      expect(found).toBeNull();
    });

    it("returns null for nonexistent id", async () => {
      const found = await repo.findById("nonexistent", userId);
      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("updates title and returns updated todo", async () => {
      const created = await repo.create(userId, { title: "Original" });
      const updated = await repo.update(created.id, userId, {
        title: "Updated",
      });

      expect(updated).not.toBeNull();
      expect(updated!.title).toBe("Updated");
      expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );
    });

    it("updates done status", async () => {
      const created = await repo.create(userId, { title: "Todo" });
      const updated = await repo.update(created.id, userId, { done: true });

      expect(updated!.done).toBe(true);
    });

    it("returns null if todo belongs to another user", async () => {
      const created = await repo.create(userId, { title: "Mine" });
      const updated = await repo.update(created.id, otherUserId, {
        title: "Hacked",
      });

      expect(updated).toBeNull();
    });

    it("returns null for nonexistent id", async () => {
      const updated = await repo.update("nonexistent", userId, {
        title: "Nope",
      });
      expect(updated).toBeNull();
    });
  });

  describe("delete", () => {
    it("deletes a todo and returns it", async () => {
      const created = await repo.create(userId, { title: "Delete me" });
      const deleted = await repo.delete(created.id, userId);

      expect(deleted).not.toBeNull();
      expect(deleted!.id).toBe(created.id);

      const found = await repo.findById(created.id, userId);
      expect(found).toBeNull();
    });

    it("returns null if todo belongs to another user", async () => {
      const created = await repo.create(userId, { title: "Mine" });
      const deleted = await repo.delete(created.id, otherUserId);

      expect(deleted).toBeNull();

      const found = await repo.findById(created.id, userId);
      expect(found).not.toBeNull();
    });

    it("returns null for nonexistent id", async () => {
      const deleted = await repo.delete("nonexistent", userId);
      expect(deleted).toBeNull();
    });
  });

  describe("clear", () => {
    it("removes all todos", async () => {
      await repo.create(userId, { title: "Todo 1" });
      await repo.create(userId, { title: "Todo 2" });

      repo.clear();

      const todos = await repo.findAll(userId);
      expect(todos).toEqual([]);
    });
  });
});

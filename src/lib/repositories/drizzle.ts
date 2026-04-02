import type { Todo } from "@/lib/db/schema";
import type { TodoRepository } from "./todo-repository";
import type { CreateTodoInput, UpdateTodoInput } from "@/lib/schemas";
import { db } from "@/lib/db";
import { todos } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export class DrizzleTodoRepository implements TodoRepository {
  async findAll(userId: string): Promise<Todo[]> {
    return db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId))
      .orderBy(desc(todos.createdAt));
  }

  async findById(id: string, userId: string): Promise<Todo | null> {
    const [todo] = await db
      .select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)));
    return todo ?? null;
  }

  async create(userId: string, data: CreateTodoInput): Promise<Todo> {
    const [todo] = await db
      .insert(todos)
      .values({
        userId,
        title: data.title,
        description: data.description ?? null,
      })
      .returning();
    return todo;
  }

  async update(
    id: string,
    userId: string,
    data: UpdateTodoInput
  ): Promise<Todo | null> {
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    const [updated] = await db
      .update(todos)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning();
    return updated ?? null;
  }

  async delete(id: string, userId: string): Promise<Todo | null> {
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    await db
      .delete(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)));
    return existing;
  }
}

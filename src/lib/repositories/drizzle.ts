import type { Todo } from "@/lib/db/schema";
import type { TodoRepository } from "./todo-repository";
import type { CreateTodoInput, UpdateTodoInput } from "@/lib/schemas";
import { todos } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { PgTable } from "drizzle-orm/pg-core";

export class DrizzleTodoRepository<
  T extends Record<string, PgTable> = Record<string, PgTable>,
> implements TodoRepository {
  private db: PostgresJsDatabase<T>;

  constructor(db: PostgresJsDatabase<T>) {
    this.db = db;
  }

  async findAll(userId: string): Promise<Todo[]> {
    return this.db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId))
      .orderBy(desc(todos.createdAt));
  }

  async findById(id: string, userId: string): Promise<Todo | null> {
    const [todo] = await this.db
      .select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)));
    return todo ?? null;
  }

  async create(userId: string, data: CreateTodoInput): Promise<Todo> {
    const [todo] = await this.db
      .insert(todos)
      .values({
        userId,
        title: data.title,
        description: data.description ?? null,
      })
      .returning();
    return todo!;
  }

  async update(
    id: string,
    userId: string,
    data: UpdateTodoInput,
  ): Promise<Todo | null> {
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    const [updated] = await this.db
      .update(todos)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning();
    return updated ?? null;
  }

  async delete(id: string, userId: string): Promise<Todo | null> {
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    await this.db
      .delete(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)));
    return existing;
  }
}

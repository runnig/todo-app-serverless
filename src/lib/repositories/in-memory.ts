import type { Todo } from "@/lib/db/schema";
import type { TodoRepository } from "./todo-repository";
import type { CreateTodoInput, UpdateTodoInput } from "@/lib/schemas";

export class InMemoryTodoRepository implements TodoRepository {
  private todos: Map<string, Todo> = new Map();

  async findAll(userId: string): Promise<Todo[]> {
    return Array.from(this.todos.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findById(id: string, userId: string): Promise<Todo | null> {
    const todo = this.todos.get(id);
    if (!todo || todo.userId !== userId) return null;
    return { ...todo };
  }

  async create(userId: string, data: CreateTodoInput): Promise<Todo> {
    const now = new Date();
    const todo: Todo = {
      id: crypto.randomUUID(),
      userId,
      title: data.title,
      description: data.description ?? null,
      done: false,
      createdAt: now,
      updatedAt: now,
    };
    this.todos.set(todo.id, todo);
    return { ...todo };
  }

  async update(
    id: string,
    userId: string,
    data: UpdateTodoInput,
  ): Promise<Todo | null> {
    const existing = this.todos.get(id);
    if (!existing || existing.userId !== userId) return null;

    const updated: Todo = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined),
      ),
      updatedAt: new Date(),
    };
    this.todos.set(id, updated);
    return { ...updated };
  }

  async delete(id: string, userId: string): Promise<Todo | null> {
    const existing = this.todos.get(id);
    if (!existing || existing.userId !== userId) return null;
    this.todos.delete(id);
    return { ...existing };
  }

  clear(): void {
    this.todos.clear();
  }
}

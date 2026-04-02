import type { Todo } from "@/lib/db/schema";
import type { CreateTodoInput, UpdateTodoInput } from "@/lib/schemas";

export interface TodoRepository {
  findAll(userId: string): Promise<Todo[]>;
  findById(id: string, userId: string): Promise<Todo | null>;
  create(userId: string, data: CreateTodoInput): Promise<Todo>;
  update(id: string, userId: string, data: UpdateTodoInput): Promise<Todo | null>;
  delete(id: string, userId: string): Promise<Todo | null>;
}

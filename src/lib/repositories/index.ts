import { DrizzleTodoRepository } from "./drizzle";
import type { TodoRepository } from "./todo-repository";
import { db } from "@/lib/db";

export function getTodoRepository(): TodoRepository {
  return new DrizzleTodoRepository(db);
}

export type { TodoRepository } from "./todo-repository";

import { DrizzleTodoRepository } from "./drizzle";
import type { TodoRepository } from "./todo-repository";
import { db } from "@/lib/db";

let _instance: TodoRepository | null = null;

export function getTodoRepository(): TodoRepository {
  if (!_instance) {
    _instance = new DrizzleTodoRepository(db);
  }
  return _instance;
}

export function setTodoRepository(repo: TodoRepository): void {
  _instance = repo;
}

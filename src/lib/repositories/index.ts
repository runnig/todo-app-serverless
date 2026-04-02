import { DrizzleTodoRepository } from "./drizzle";
import type { TodoRepository } from "./todo-repository";

let _instance: TodoRepository | null = null;

export function getTodoRepository(): TodoRepository {
  if (!_instance) {
    _instance = new DrizzleTodoRepository();
  }
  return _instance;
}

export function setTodoRepository(repo: TodoRepository): void {
  _instance = repo;
}

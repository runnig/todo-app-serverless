import type { TodoRepository } from "@/lib/repositories/todo-repository";

export interface RouteDeps {
  getAuthUser: () => Promise<{ id: string } | null>;
  repo: TodoRepository;
}

import type { ApiResponse, TodoResponse } from "./types";
import type { CreateTodoInput, UpdateTodoInput } from "./schemas";

class ApiClientError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const json: ApiResponse<T> = await response.json();

  if (!response.ok || json.error) {
    const error = json.error!;
    throw new ApiClientError(error.code, response.status, error.message);
  }

  return json.data as T;
}

export const apiClient = {
  async getTodos(): Promise<TodoResponse[]> {
    const response = await fetch("/api/todos", { cache: "no-store" });
    return handleResponse<TodoResponse[]>(response);
  },

  async createTodo(input: CreateTodoInput): Promise<TodoResponse> {
    const response = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleResponse<TodoResponse>(response);
  },

  async updateTodo(id: string, input: UpdateTodoInput): Promise<TodoResponse> {
    const response = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleResponse<TodoResponse>(response);
  },

  async deleteTodo(id: string): Promise<TodoResponse> {
    const response = await fetch(`/api/todos/${id}`, {
      method: "DELETE",
    });
    return handleResponse<TodoResponse>(response);
  },
};

export { ApiClientError };

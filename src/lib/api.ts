import { z } from "zod";
import { todoResponseSchema, apiErrorSchema } from "./types";
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

function apiSuccessSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    error: z.null(),
  });
}

const apiFailureResponseSchema = z.object({
  data: z.null(),
  error: apiErrorSchema,
});

async function handleResponse<T extends z.ZodTypeAny>(
  response: Response,
  dataSchema: T,
): Promise<z.infer<T>> {
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ApiClientError(
      "INTERNAL_ERROR",
      response.status,
      "Invalid response from server",
    );
  }

  if (!response.ok) {
    const parsed = apiFailureResponseSchema.safeParse(json);
    if (parsed.success) {
      const error = parsed.data.error;
      throw new ApiClientError(error.code, response.status, error.message);
    }
    throw new ApiClientError(
      "INTERNAL_ERROR",
      response.status,
      "Unexpected error response shape",
    );
  }

  const schema = apiSuccessSchema(dataSchema);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiClientError(
      "INTERNAL_ERROR",
      response.status,
      "Unexpected response shape",
    );
  }

  return (parsed.data as { data: z.infer<T> }).data;
}

export const apiClient = {
  async getTodos(): Promise<z.infer<typeof todoResponseSchema>[]> {
    const response = await fetch("/api/todos", { cache: "no-store" });
    return handleResponse(response, z.array(todoResponseSchema));
  },

  async createTodo(
    input: CreateTodoInput,
  ): Promise<z.infer<typeof todoResponseSchema>> {
    const response = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleResponse(response, todoResponseSchema);
  },

  async updateTodo(
    id: string,
    input: UpdateTodoInput,
  ): Promise<z.infer<typeof todoResponseSchema>> {
    const response = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleResponse(response, todoResponseSchema);
  },

  async deleteTodo(id: string): Promise<z.infer<typeof todoResponseSchema>> {
    const response = await fetch(`/api/todos/${id}`, {
      method: "DELETE",
    });
    return handleResponse(response, todoResponseSchema);
  },
};

export { ApiClientError };

import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient, ApiClientError } from "@/lib/api";

const mockFetch = vi.fn();

vi.stubGlobal("fetch", mockFetch);

describe("apiClient", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("getTodos", () => {
    it("returns todo list on success", async () => {
      const mockTodos = [
        {
          id: "1",
          userId: "u1",
          title: "Test todo",
          description: null,
          done: false,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTodos, error: null }),
      });

      const result = await apiClient.getTodos();
      expect(result).toEqual(mockTodos);
      expect(mockFetch).toHaveBeenCalledWith("/api/todos", {
        cache: "no-store",
      });
    });

    it("throws ApiClientError on 401", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          data: null,
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        }),
      });

      await expect(apiClient.getTodos()).rejects.toThrow(ApiClientError);
    });

    it("includes error details on 401", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          data: null,
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        }),
      });

      try {
        await apiClient.getTodos();
      } catch (err) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect((err as ApiClientError).code).toBe("UNAUTHORIZED");
        expect((err as ApiClientError).status).toBe(401);
      }
    });
  });

  describe("createTodo", () => {
    it("sends POST request and returns created todo", async () => {
      const input = { title: "New todo" };
      const mockTodo = {
        id: "1",
        userId: "u1",
        title: "New todo",
        description: null,
        done: false,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ data: mockTodo, error: null }),
      });

      const result = await apiClient.createTodo(input);
      expect(result).toEqual(mockTodo);
      expect(mockFetch).toHaveBeenCalledWith("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    });

    it("throws ApiClientError on validation error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          data: null,
          error: { code: "VALIDATION_ERROR", message: "Title is required" },
        }),
      });

      await expect(apiClient.createTodo({ title: "" })).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
      });
    });
  });

  describe("updateTodo", () => {
    it("sends PATCH request with partial data", async () => {
      const mockTodo = {
        id: "1",
        userId: "u1",
        title: "Test",
        description: null,
        done: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTodo, error: null }),
      });

      const result = await apiClient.updateTodo("1", { done: true });
      expect(result.done).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith("/api/todos/1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: true }),
      });
    });
  });

  describe("deleteTodo", () => {
    it("sends DELETE request and returns deleted todo", async () => {
      const mockTodo = {
        id: "1",
        userId: "u1",
        title: "Test",
        description: null,
        done: false,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTodo, error: null }),
      });

      const result = await apiClient.deleteTodo("1");
      expect(result.id).toBe("1");
      expect(mockFetch).toHaveBeenCalledWith("/api/todos/1", {
        method: "DELETE",
      });
    });

    it("throws ApiClientError on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          data: null,
          error: { code: "NOT_FOUND", message: "Todo not found" },
        }),
      });

      await expect(apiClient.deleteTodo("nonexistent")).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
      });
    });
  });

  describe("response safety", () => {
    it("throws ApiClientError when response is not valid JSON", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError("Unexpected token");
        },
      });

      await expect(apiClient.getTodos()).rejects.toMatchObject({
        code: "INTERNAL_ERROR",
        message: "Invalid response from server",
      });
    });

    it("throws ApiClientError when response shape is unexpected", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: "shape" }),
      });

      await expect(apiClient.getTodos()).rejects.toMatchObject({
        code: "INTERNAL_ERROR",
        message: "Unexpected response shape",
      });
    });
  });
});

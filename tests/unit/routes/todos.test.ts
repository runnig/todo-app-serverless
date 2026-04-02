import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { Todo } from "@/lib/db/schema";
import type { TodoRepository } from "@/lib/repositories/todo-repository";
import type { RouteDeps } from "@/lib/route-deps";
import { handleGet, handlePost } from "@/lib/handlers/todos";
import { handlePatch, handleDelete } from "@/lib/handlers/todo-by-id";

const mockGetAuthUser = vi.fn<() => Promise<{ id: string } | null>>();
const mockRepo: TodoRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const AUTHENTICATED_USER_ID = "user-123";

function makeDeps(): RouteDeps {
  return {
    getAuthUser: mockGetAuthUser,
    repo: mockRepo,
  };
}

function makeAuthenticated() {
  mockGetAuthUser.mockResolvedValue({ id: AUTHENTICATED_USER_ID });
}

function makeUnauthenticated() {
  mockGetAuthUser.mockResolvedValue(null);
}

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: "todo-1",
    userId: AUTHENTICATED_USER_ID,
    title: "Test todo",
    description: null,
    done: false,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    ...overrides,
  };
}

function makeRequest(body?: unknown) {
  if (body !== undefined) {
    return new NextRequest("http://localhost/api/todos", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }
  return new NextRequest("http://localhost/api/todos");
}

function makeIdRequest(id: string, body?: unknown) {
  if (body !== undefined) {
    return new NextRequest(`http://localhost/api/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }
  return new NextRequest(`http://localhost/api/todos/${id}`, {
    method: "DELETE",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  makeUnauthenticated();
});

describe("handleGet", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await handleGet(makeDeps());
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(json.data).toBeNull();
  });

  it("returns mapped todos for authenticated user", async () => {
    makeAuthenticated();
    const todos = [makeTodo(), makeTodo({ id: "todo-2", title: "Second" })];
    vi.mocked(mockRepo.findAll).mockResolvedValue(todos);

    const res = await handleGet(makeDeps());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data).toHaveLength(2);
    expect(json.data[0]).toEqual({
      id: "todo-1",
      userId: AUTHENTICATED_USER_ID,
      title: "Test todo",
      description: null,
      done: false,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });
    expect(json.error).toBeNull();
    expect(mockRepo.findAll).toHaveBeenCalledWith(AUTHENTICATED_USER_ID);
  });
});

describe("handlePost", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await handlePost(makeDeps(), makeRequest({ title: "Test" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 with validation messages for invalid payload", async () => {
    makeAuthenticated();
    const res = await handlePost(makeDeps(), makeRequest({ title: "" }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.message).toContain("Title is required");
  });

  it("returns 400 for malformed JSON body", async () => {
    makeAuthenticated();
    const req = new NextRequest("http://localhost/api/todos", {
      method: "POST",
      body: "not json{{{",
      headers: { "Content-Type": "application/json" },
    });

    const res = await handlePost(makeDeps(), req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.message).toBe("Invalid JSON body");
  });

  it("returns 201 and normalized TodoResponse on success", async () => {
    makeAuthenticated();
    const created = makeTodo();
    vi.mocked(mockRepo.create).mockResolvedValue(created);

    const res = await handlePost(
      makeDeps(),
      makeRequest({ title: "Test todo" }),
    );
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.data.id).toBe("todo-1");
    expect(json.data.title).toBe("Test todo");
    expect(json.data.createdAt).toBe("2024-01-01T00:00:00.000Z");
    expect(json.error).toBeNull();
    expect(mockRepo.create).toHaveBeenCalledWith(AUTHENTICATED_USER_ID, {
      title: "Test todo",
    });
  });
});

describe("handlePatch", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await handlePatch(
      makeDeps(),
      makeIdRequest("todo-1", { done: true }),
      { params: Promise.resolve({ id: "todo-1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 with validation messages for invalid payload", async () => {
    makeAuthenticated();
    const res = await handlePatch(
      makeDeps(),
      makeIdRequest("todo-1", { title: "" }),
      { params: Promise.resolve({ id: "todo-1" }) },
    );
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for malformed JSON body", async () => {
    makeAuthenticated();
    const req = new NextRequest("http://localhost/api/todos/todo-1", {
      method: "PATCH",
      body: "not json{{{",
      headers: { "Content-Type": "application/json" },
    });

    const res = await handlePatch(makeDeps(), req, {
      params: Promise.resolve({ id: "todo-1" }),
    });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.message).toBe("Invalid JSON body");
  });

  it("returns 404 when repo returns null", async () => {
    makeAuthenticated();
    vi.mocked(mockRepo.update).mockResolvedValue(null);

    const res = await handlePatch(
      makeDeps(),
      makeIdRequest("todo-1", { done: true }),
      { params: Promise.resolve({ id: "todo-1" }) },
    );
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("returns updated TodoResponse on success", async () => {
    makeAuthenticated();
    const updated = makeTodo({ done: true });
    vi.mocked(mockRepo.update).mockResolvedValue(updated);

    const res = await handlePatch(
      makeDeps(),
      makeIdRequest("todo-1", { done: true }),
      { params: Promise.resolve({ id: "todo-1" }) },
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.done).toBe(true);
    expect(json.error).toBeNull();
    expect(mockRepo.update).toHaveBeenCalledWith(
      "todo-1",
      AUTHENTICATED_USER_ID,
      { done: true },
    );
  });
});

describe("handleDelete", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await handleDelete(makeDeps(), makeIdRequest("todo-1"), {
      params: Promise.resolve({ id: "todo-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 when repo returns null", async () => {
    makeAuthenticated();
    vi.mocked(mockRepo.delete).mockResolvedValue(null);

    const res = await handleDelete(makeDeps(), makeIdRequest("todo-1"), {
      params: Promise.resolve({ id: "todo-1" }),
    });
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("returns deleted TodoResponse on success", async () => {
    makeAuthenticated();
    const deleted = makeTodo();
    vi.mocked(mockRepo.delete).mockResolvedValue(deleted);

    const res = await handleDelete(makeDeps(), makeIdRequest("todo-1"), {
      params: Promise.resolve({ id: "todo-1" }),
    });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.id).toBe("todo-1");
    expect(json.error).toBeNull();
    expect(mockRepo.delete).toHaveBeenCalledWith(
      "todo-1",
      AUTHENTICATED_USER_ID,
    );
  });
});

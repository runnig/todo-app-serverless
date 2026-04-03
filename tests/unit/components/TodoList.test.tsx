import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoList } from "@/components/TodoList";
import { apiClient } from "@/lib/api";
import type { TodoResponse } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  apiClient: {
    getTodos: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
  },
}));

const makeTodo = (overrides?: Partial<TodoResponse>): TodoResponse => ({
  id: "1",
  userId: "u1",
  title: "Test todo",
  description: null,
  done: false,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

describe("TodoList", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.mocked(apiClient.getTodos).mockResolvedValue([]);
  });

  it("shows loading state initially", () => {
    vi.mocked(apiClient.getTodos).mockReturnValue(new Promise(() => {}));
    render(<TodoList />);
    expect(screen.getByText("Loading todos...")).toBeInTheDocument();
  });

  it("renders fetched todos", async () => {
    const todos = [
      makeTodo({ id: "1", title: "Buy milk" }),
      makeTodo({ id: "2", title: "Walk dog" }),
    ];
    vi.mocked(apiClient.getTodos).mockResolvedValue(todos);
    render(<TodoList />);
    expect(await screen.findByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("Walk dog")).toBeInTheDocument();
  });

  it("shows empty state when no todos exist", async () => {
    render(<TodoList />);
    expect(
      await screen.findByText("No todos yet. Add one above!"),
    ).toBeInTheDocument();
  });

  it("filters by active", async () => {
    const todos = [
      makeTodo({ id: "1", title: "Active todo", done: false }),
      makeTodo({ id: "2", title: "Done todo", done: true }),
    ];
    vi.mocked(apiClient.getTodos).mockResolvedValue(todos);
    const user = userEvent.setup();
    render(<TodoList />);
    await screen.findByText("Active todo");
    await user.click(screen.getByRole("button", { name: /Active/ }));
    expect(screen.getByText("Active todo")).toBeInTheDocument();
    expect(screen.queryByText("Done todo")).not.toBeInTheDocument();
  });

  it("filters by done", async () => {
    const todos = [
      makeTodo({ id: "1", title: "Active todo", done: false }),
      makeTodo({ id: "2", title: "Done todo", done: true }),
    ];
    vi.mocked(apiClient.getTodos).mockResolvedValue(todos);
    const user = userEvent.setup();
    render(<TodoList />);
    await screen.findByText("Active todo");
    await user.click(screen.getByRole("button", { name: /Done/ }));
    expect(screen.getByText("Done todo")).toBeInTheDocument();
    expect(screen.queryByText("Active todo")).not.toBeInTheDocument();
  });

  it("shows filter counts", async () => {
    const todos = [
      makeTodo({ id: "1", title: "Active", done: false }),
      makeTodo({ id: "2", title: "Done1", done: true }),
      makeTodo({ id: "3", title: "Done2", done: true }),
    ];
    vi.mocked(apiClient.getTodos).mockResolvedValue(todos);
    render(<TodoList />);
    await screen.findByRole("button", { name: /Active/ });
    expect(screen.getByRole("button", { name: /Active/ })).toHaveTextContent(
      /\(1\)/,
    );
    expect(screen.getByRole("button", { name: /Done/ })).toHaveTextContent(
      /\(2\)/,
    );
  });

  it("adds a new todo after creation", async () => {
    const newTodo = makeTodo({ id: "2", title: "New task" });
    vi.mocked(apiClient.createTodo).mockResolvedValue(newTodo);
    const user = userEvent.setup();
    render(<TodoList />);
    await screen.findByText("No todos yet. Add one above!");
    await user.type(
      screen.getByPlaceholderText("What needs to be done?"),
      "New task",
    );
    await user.click(screen.getByRole("button", { name: "Add todo" }));
    expect(await screen.findByText("New task")).toBeInTheDocument();
  });

  it("removes a todo after delete", async () => {
    const todo = makeTodo({ id: "1", title: "Delete me" });
    vi.mocked(apiClient.getTodos).mockResolvedValue([todo]);
    vi.mocked(apiClient.deleteTodo).mockResolvedValue(todo);
    const user = userEvent.setup();
    render(<TodoList />);
    await screen.findByText("Delete me");
    const menuButton = screen
      .getAllByRole("button")
      .find((btn) => !btn.textContent?.trim());
    await user.click(menuButton!);
    await user.click(await screen.findByText("Delete"));
    await waitFor(() => {
      expect(screen.queryByText("Delete me")).not.toBeInTheDocument();
    });
  });
});

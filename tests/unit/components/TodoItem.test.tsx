import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoItem } from "@/components/TodoItem";
import { apiClient } from "@/lib/api";
import type { TodoResponse } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  apiClient: {
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
  },
}));

const baseTodo: TodoResponse = {
  id: "1",
  userId: "u1",
  title: "Test todo",
  description: "Test desc",
  done: false,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("TodoItem", () => {
  const onUpdate = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the todo title", () => {
    render(
      <TodoItem todo={baseTodo} onUpdate={onUpdate} onDelete={onDelete} />,
    );
    expect(screen.getByText("Test todo")).toBeInTheDocument();
  });

  it("renders description when present", () => {
    render(
      <TodoItem todo={baseTodo} onUpdate={onUpdate} onDelete={onDelete} />,
    );
    expect(screen.getByText("Test desc")).toBeInTheDocument();
  });

  it("does not render description when null", () => {
    const todo = { ...baseTodo, description: null };
    render(<TodoItem todo={todo} onUpdate={onUpdate} onDelete={onDelete} />);
    expect(screen.queryByText("Test desc")).not.toBeInTheDocument();
  });

  it("applies line-through style when done", () => {
    const todo = { ...baseTodo, done: true };
    render(<TodoItem todo={todo} onUpdate={onUpdate} onDelete={onDelete} />);
    const title = screen.getByText("Test todo");
    expect(title.className).toContain("line-through");
  });

  it("calls apiClient.updateTodo with toggled done on checkbox change", async () => {
    const user = userEvent.setup();
    const updatedTodo = { ...baseTodo, done: true };
    vi.mocked(apiClient.updateTodo).mockResolvedValueOnce(updatedTodo);

    render(
      <TodoItem todo={baseTodo} onUpdate={onUpdate} onDelete={onDelete} />,
    );
    await user.click(screen.getByRole("checkbox"));

    expect(apiClient.updateTodo).toHaveBeenCalledWith("1", { done: true });
    expect(onUpdate).toHaveBeenCalledWith(updatedTodo);
  });

  it("switches to edit mode when Edit is clicked", async () => {
    const user = userEvent.setup();
    render(
      <TodoItem todo={baseTodo} onUpdate={onUpdate} onDelete={onDelete} />,
    );

    await user.click(screen.getByRole("button"));
    await user.click(await screen.findByText("Edit"));

    expect(
      screen.getByPlaceholderText("What needs to be done?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
    expect(screen.queryByText("Test todo")).not.toBeInTheDocument();
  });

  it("calls apiClient.deleteTodo and onDelete when Delete is clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.deleteTodo).mockResolvedValueOnce(baseTodo);

    render(
      <TodoItem todo={baseTodo} onUpdate={onUpdate} onDelete={onDelete} />,
    );

    await user.click(screen.getByRole("button"));
    await user.click(await screen.findByText("Delete"));

    expect(apiClient.deleteTodo).toHaveBeenCalledWith("1");
    expect(onDelete).toHaveBeenCalledWith(baseTodo);
  });

  it("restores view mode when edit is cancelled", async () => {
    const user = userEvent.setup();
    render(
      <TodoItem todo={baseTodo} onUpdate={onUpdate} onDelete={onDelete} />,
    );
    await user.click(screen.getByRole("button"));
    await user.click(await screen.findByText("Edit"));
    expect(screen.getByText("Update")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Test todo")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("What needs to be done?"),
    ).not.toBeInTheDocument();
  });

  it("calls updateTodo with description null when description is cleared", async () => {
    const user = userEvent.setup();
    const todo = { ...baseTodo, description: "Has desc" };
    const updatedTodo = { ...todo, description: null };
    vi.mocked(apiClient.updateTodo).mockResolvedValueOnce(updatedTodo);
    render(<TodoItem todo={todo} onUpdate={onUpdate} onDelete={onDelete} />);
    await user.click(screen.getByRole("button"));
    await user.click(await screen.findByText("Edit"));
    const descInput = screen.getByPlaceholderText("Description (optional)");
    await user.clear(descInput);
    await user.click(screen.getByRole("button", { name: "Update" }));
    expect(apiClient.updateTodo).toHaveBeenCalledWith("1", {
      title: "Test todo",
      description: null,
    });
  });

  it("does not call onDelete when deleteTodo rejects", async () => {
    const user = userEvent.setup();
    const saved = process.listeners("unhandledRejection").slice();
    process.removeAllListeners("unhandledRejection");
    const caught = new Promise<void>((r) =>
      process.once("unhandledRejection", () => r()),
    );
    vi.mocked(apiClient.deleteTodo).mockRejectedValueOnce(new Error("fail"));
    render(
      <TodoItem todo={baseTodo} onUpdate={onUpdate} onDelete={onDelete} />,
    );
    await user.click(screen.getByRole("button"));
    await user.click(await screen.findByText("Delete"));
    await caught;
    expect(onDelete).not.toHaveBeenCalled();
    process.removeAllListeners("unhandledRejection");
    saved.forEach((l) =>
      process.on("unhandledRejection", l as (...args: unknown[]) => void),
    );
  });
});

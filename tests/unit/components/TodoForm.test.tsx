import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoForm } from "@/components/TodoForm";
import type { TodoResponse } from "@/lib/types";

afterEach(cleanup);

const makeTodo = (overrides?: Partial<TodoResponse>): TodoResponse => ({
  id: "1",
  userId: "u1",
  title: "Existing todo",
  description: "Existing desc",
  done: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe("TodoForm", () => {
  it("renders input and submit button", () => {
    render(<TodoForm onSubmit={vi.fn().mockResolvedValue(undefined)} />);
    expect(
      screen.getByPlaceholderText("What needs to be done?"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add todo" }),
    ).toBeInTheDocument();
  });

  it("disables submit button when title is blank or whitespace", () => {
    render(<TodoForm onSubmit={vi.fn().mockResolvedValue(undefined)} />);
    const button = screen.getByRole("button", { name: "Add todo" });
    expect(button).toBeDisabled();
  });

  it("calls onSubmit with title and description and clears fields in create mode", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TodoForm onSubmit={onSubmit} />);

    await user.type(
      screen.getByPlaceholderText("What needs to be done?"),
      "My task",
    );
    await user.type(
      screen.getByPlaceholderText("Description (optional)"),
      "A description",
    );

    const button = screen.getByRole("button", { name: "Add todo" });
    await user.click(button);

    expect(onSubmit).toHaveBeenCalledWith({
      title: "My task",
      description: "A description",
    });

    expect(screen.getByPlaceholderText("What needs to be done?")).toHaveValue(
      "",
    );
    expect(screen.getByPlaceholderText("Description (optional)")).toHaveValue(
      "",
    );
  });

  it("sends description as undefined when empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TodoForm onSubmit={onSubmit} />);

    await user.type(
      screen.getByPlaceholderText("What needs to be done?"),
      "Only title",
    );
    await user.click(screen.getByRole("button", { name: "Add todo" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Only title",
      description: undefined,
    });
  });

  it("does not clear fields in edit mode", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const initial = makeTodo({ title: "Edit me", description: "Edit desc" });
    render(<TodoForm initial={initial} onSubmit={onSubmit} />);

    const titleInput = screen.getByPlaceholderText("What needs to be done?");
    const descInput = screen.getByPlaceholderText("Description (optional)");
    expect(titleInput).toHaveValue("Edit me");
    expect(descInput).toHaveValue("Edit desc");

    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(onSubmit).toHaveBeenCalled();
    expect(titleInput).toHaveValue("Edit me");
    expect(descInput).toHaveValue("Edit desc");
  });

  it("shows Cancel button when onCancel is provided", () => {
    const onCancel = vi.fn();
    render(
      <TodoForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("displays error message when onSubmit throws", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("Network error"));
    render(<TodoForm onSubmit={onSubmit} />);

    await user.type(
      screen.getByPlaceholderText("What needs to be done?"),
      "Fail task",
    );
    await user.click(screen.getByRole("button", { name: "Add todo" }));

    expect(await screen.findByText("Network error")).toBeInTheDocument();
  });

  it("shows 'Update' button text in edit mode", () => {
    const initial = makeTodo();
    render(
      <TodoForm
        initial={initial}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add todo" }),
    ).not.toBeInTheDocument();
  });
});

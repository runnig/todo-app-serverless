"use client";

import { useEffect, useState } from "react";
import { TodoItem } from "./TodoItem";
import { TodoForm } from "./TodoForm";
import { apiClient } from "@/lib/api";
import type { TodoResponse, TodoFilter } from "@/lib/types";
import { TODO_FILTERS } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function TodoList() {
  const [todos, setTodos] = useState<TodoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TodoFilter>(TODO_FILTERS.all);

  async function fetchTodos() {
    setLoading(true);
    try {
      const data = await apiClient.getTodos();
      setTodos(data);
    } catch {
      // Errors are handled by the API client
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTodos();
  }, []);

  function handleCreate(data: {
    title: string;
    // TODO: can we replace the optional
    // with empty string?
    description?: string | undefined;
  }) {
    return apiClient.createTodo(data).then((todo) => {
      setTodos((prev) => [todo, ...prev]);
    });
  }

  function handleUpdate(updated: TodoResponse) {
    setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleDelete(deleted: TodoResponse) {
    setTodos((prev) => prev.filter((t) => t.id !== deleted.id));
  }

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">Loading todos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TodoForm onSubmit={handleCreate} />

      <div className="flex gap-2">
        {Object.values(TODO_FILTERS).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== TODO_FILTERS.all && (
              <span className="ml-1 text-xs">
                (
                {
                  todos.filter((t) => (f === "active" ? !t.done : t.done))
                    .length
                }
                )
              </span>
            )}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            {todos.length === 0
              ? "No todos yet. Add one above!"
              : `No ${filter} todos.`}
          </p>
        )}
        {filtered.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

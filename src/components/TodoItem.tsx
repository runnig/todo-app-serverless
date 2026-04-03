"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { TodoForm } from "./TodoForm";
import { apiClient } from "@/lib/api";
import type { TodoResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  todo: TodoResponse;
  onUpdate: (todo: TodoResponse) => void;
  onDelete: (todo: TodoResponse) => void;
}

export function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [editing, setEditing] = useState(false);

  async function handleToggleDone() {
    const updated = await apiClient.updateTodo(todo.id, { done: !todo.done });
    onUpdate(updated);
  }

  // TODO: consider using empty string "" instead of undefined
  async function handleUpdate(data: {
    title: string;
    description?: string | undefined;
  }) {
    const updated = await apiClient.updateTodo(todo.id, {
      title: data.title,
      description: data.description || null,
    });
    onUpdate(updated);
    setEditing(false);
  }

  async function handleDelete() {
    await apiClient.deleteTodo(todo.id);
    onDelete(todo);
  }

  if (editing) {
    return (
      <TodoForm
        initial={todo}
        onSubmit={handleUpdate}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <Card className={todo.done ? "opacity-60" : ""}>
      <CardContent className="flex items-start gap-3 p-4">
        <Checkbox
          checked={todo.done}
          onCheckedChange={handleToggleDone}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <p className={todo.done ? "line-through text-muted-foreground" : ""}>
            {todo.title}
          </p>
          {todo.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {todo.description}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-8 w-8",
            )}
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CreateTodoInput } from "@/lib/schemas";
import type { TodoResponse } from "@/lib/types";

interface TodoFormProps {
  initial?: TodoResponse;
  onSubmit: (data: CreateTodoInput) => Promise<void>;
  onCancel?: () => void;
}

export function TodoForm({ initial, onSubmit, onCancel }: TodoFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // TODO: consider if we can always return {title, description}
      // even when description is an empty string
      const data: CreateTodoInput = description
        ? { title, description }
        : { title };

      await onSubmit(data);
      if (!initial) {
        setTitle("");
        setDescription("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <Input
        placeholder="What needs to be done?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        maxLength={200}
      />
      <Textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={2000}
        rows={2}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !title.trim()}>
          {loading ? "Saving..." : initial ? "Update" : "Add todo"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

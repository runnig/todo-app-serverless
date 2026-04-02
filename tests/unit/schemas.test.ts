import { describe, it, expect } from "vitest";
import { createTodoSchema, updateTodoSchema } from "@/lib/schemas";

describe("createTodoSchema", () => {
  it("accepts valid input with title only", () => {
    const result = createTodoSchema.safeParse({ title: "Buy milk" });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with title and description", () => {
    const result = createTodoSchema.safeParse({
      title: "Buy milk",
      description: "From the grocery store",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createTodoSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Title is required");
    }
  });

  it("rejects title over 200 characters", () => {
    const result = createTodoSchema.safeParse({ title: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects description over 2000 characters", () => {
    const result = createTodoSchema.safeParse({
      title: "Valid",
      description: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing title field", () => {
    const result = createTodoSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("updateTodoSchema", () => {
  it("accepts empty object (no fields to update)", () => {
    const result = updateTodoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial update with done only", () => {
    const result = updateTodoSchema.safeParse({ done: true });
    expect(result.success).toBe(true);
  });

  it("accepts partial update with title only", () => {
    const result = updateTodoSchema.safeParse({ title: "Updated title" });
    expect(result.success).toBe(true);
  });

  it("accepts setting description to null", () => {
    const result = updateTodoSchema.safeParse({ description: null });
    expect(result.success).toBe(true);
  });

  it("rejects invalid title when provided", () => {
    const result = updateTodoSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean done value", () => {
    const result = updateTodoSchema.safeParse({ done: "true" });
    expect(result.success).toBe(false);
  });
});

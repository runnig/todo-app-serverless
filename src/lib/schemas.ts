import { z } from "zod";

export const todoIdSchema = z.string().uuid("Invalid todo ID");

export const createTodoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .optional(),
});

export const updateTodoSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200, "Title must be at most 200 characters")
      .optional(),
    description: z
      .string()
      .max(2000, "Description must be at most 2000 characters")
      .nullable()
      .optional(),
    done: z.boolean().optional(),
  })
  .refine(
    // TODO: add a comment or type annotation for data.
    // Consider replacing the optionality/undefined in data with
    // empty strings
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.done !== undefined,
    { message: "At least one field must be provided", path: [] },
  );

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;

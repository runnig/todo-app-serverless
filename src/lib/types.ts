import { z } from "zod";
import type { Todo } from "@/lib/db/schema";

export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const TODO_FILTERS = {
  all: "all",
  active: "active",
  done: "done",
} as const;

export type TodoFilter = (typeof TODO_FILTERS)[keyof typeof TODO_FILTERS];

// TODO: consider replacing ApiSuccess and ApiError with
// ApiResponse object with status_code:
// enum StatusCode {
//   OK = 0,
//   NOT_FOUND = 1,
//   ...
// }
// export interface NoData {}
// export interface ApiResponse<T> {
//    data: T | NoData;
//    status_code: StatusCode;
//    error: string; // if no error, empty
// }

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: { code: ErrorCode; message: string };
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
}

export const todoResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  done: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export interface TodoResponse {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toTodoResponse(todo: Todo): TodoResponse {
  return {
    id: todo.id,
    userId: todo.userId,
    title: todo.title,
    description: todo.description,
    done: todo.done,
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
  };
}

import { NextRequest, NextResponse } from "next/server";
import { createTodoSchema } from "@/lib/schemas";
import { ApiResponse, TodoResponse, toTodoResponse } from "@/lib/types";
import type { RouteDeps } from "@/lib/route-deps";

export async function handleGet(
  deps: RouteDeps,
): Promise<NextResponse<ApiResponse<TodoResponse[]>>> {
  const user = await deps.getAuthUser();

  if (!user) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      },
      { status: 401 },
    );
  }

  const results = await deps.repo.findAll(user.id);

  return NextResponse.json({
    data: results.map(toTodoResponse),
    error: null,
  });
}

export async function handlePost(
  deps: RouteDeps,
  request: NextRequest,
): Promise<NextResponse<ApiResponse<TodoResponse>>> {
  const user = await deps.getAuthUser();

  if (!user) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" },
      },
      { status: 400 },
    );
  }

  const parsed = createTodoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues
            .map((i: { message: string }) => i.message)
            .join(", "),
        },
      },
      { status: 400 },
    );
  }

  const todo = await deps.repo.create(user.id, parsed.data);

  return NextResponse.json(
    { data: toTodoResponse(todo), error: null },
    { status: 201 },
  );
}

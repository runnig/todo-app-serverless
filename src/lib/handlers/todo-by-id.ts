import { NextRequest, NextResponse } from "next/server";
import { updateTodoSchema } from "@/lib/schemas";
import { ApiResponse, TodoResponse, toTodoResponse } from "@/lib/types";
import type { RouteDeps } from "@/lib/route-deps";

type TodoResponseSingle = ApiResponse<TodoResponse>;

export async function handlePatch(
  deps: RouteDeps,
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<TodoResponseSingle>> {
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

  const { id } = await params;
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

  const parsed = updateTodoSchema.safeParse(body);

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

  const updated = await deps.repo.update(id, user.id, parsed.data);

  if (!updated) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "NOT_FOUND", message: "Todo not found" },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: toTodoResponse(updated), error: null });
}

export async function handleDelete(
  deps: RouteDeps,
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<TodoResponseSingle>> {
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

  const { id } = await params;
  const deleted = await deps.repo.delete(id, user.id);

  if (!deleted) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "NOT_FOUND", message: "Todo not found" },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: toTodoResponse(deleted), error: null });
}

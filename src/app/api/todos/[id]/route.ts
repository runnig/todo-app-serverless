import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTodoRepository } from "@/lib/repositories";
import { updateTodoSchema } from "@/lib/schemas";
import { ApiResponse, TodoResponse, toTodoResponse } from "@/lib/types";

type TodoResponseSingle = ApiResponse<TodoResponse>;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<TodoResponseSingle>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateTodoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i: { message: string }) => i.message).join(", "),
        },
      },
      { status: 400 }
    );
  }

  const repo = getTodoRepository();
  const updated = await repo.update(id, user.id, parsed.data);

  if (!updated) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "NOT_FOUND", message: "Todo not found" },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: toTodoResponse(updated), error: null });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<TodoResponseSingle>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      },
      { status: 401 }
    );
  }

  const { id } = await params;
  const repo = getTodoRepository();
  const deleted = await repo.delete(id, user.id);

  if (!deleted) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "NOT_FOUND", message: "Todo not found" },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: toTodoResponse(deleted), error: null });
}

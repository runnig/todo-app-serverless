import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTodoRepository } from "@/lib/repositories";
import { createTodoSchema } from "@/lib/schemas";
import { ApiResponse, TodoResponse, toTodoResponse } from "@/lib/types";

export async function GET(): Promise<
  NextResponse<ApiResponse<TodoResponse[]>>
> {
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
      { status: 401 },
    );
  }

  const repo = getTodoRepository();
  const results = await repo.findAll(user.id);

  return NextResponse.json({
    data: results.map(toTodoResponse),
    error: null,
  });
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<TodoResponse>>> {
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
      { status: 401 },
    );
  }

  const body = await request.json();
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

  const repo = getTodoRepository();
  const todo = await repo.create(user.id, parsed.data);

  return NextResponse.json(
    { data: toTodoResponse(todo), error: null },
    { status: 201 },
  );
}

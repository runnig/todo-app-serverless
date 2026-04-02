import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTodoRepository } from "@/lib/repositories";
import { ApiResponse, TodoResponse } from "@/lib/types";
import { handlePatch, handleDelete } from "@/lib/handlers/todo-by-id";

function makeDeps() {
  return {
    getAuthUser: async () => {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      return data.user?.id ? { id: data.user.id } : null;
    },
    repo: getTodoRepository(),
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<TodoResponse>>> {
  return handlePatch(makeDeps(), request, { params });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<TodoResponse>>> {
  return handleDelete(makeDeps(), _request, { params });
}

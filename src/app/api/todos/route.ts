import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTodoRepository } from "@/lib/repositories";
import { ApiResponse, TodoResponse } from "@/lib/types";
import { handleGet, handlePost } from "@/lib/handlers/todos";

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

export async function GET(): Promise<
  NextResponse<ApiResponse<TodoResponse[]>>
> {
  return handleGet(makeDeps());
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<TodoResponse>>> {
  return handlePost(makeDeps(), request);
}

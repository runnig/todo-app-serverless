import { AuthGuard } from "@/components/AuthGuard";
import { TodoList } from "@/components/TodoList";
import { LogoutButton } from "./logout-button";

export default function HomePage() {
  return (
    <AuthGuard>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Todos</h1>
          <LogoutButton />
        </header>
        <TodoList />
      </div>
    </AuthGuard>
  );
}

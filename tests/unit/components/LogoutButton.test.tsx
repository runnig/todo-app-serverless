import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogoutButton } from "@/app/logout-button";

const mockSignOut = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: mockSignOut },
  }),
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockPush.mockClear();
    mockRefresh.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a button with 'Log out' text", () => {
    render(<LogoutButton />);
    expect(screen.getByRole("button", { name: /log out/i })).toBeVisible();
  });

  it("calls signOut, then navigates to /login and refreshes", async () => {
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole("button", { name: /log out/i }));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/login");
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    const signOutOrder = mockSignOut.mock.invocationCallOrder[0]!;
    const pushOrder = mockPush.mock.invocationCallOrder[0]!;
    const refreshOrder = mockRefresh.mock.invocationCallOrder[0]!;
    expect(signOutOrder).toBeLessThan(pushOrder);
    expect(pushOrder).toBeLessThan(refreshOrder);
  });
});

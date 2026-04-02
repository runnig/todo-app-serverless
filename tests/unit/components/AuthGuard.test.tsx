import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { AuthGuard } from "@/components/AuthGuard";

const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}));

describe("AuthGuard", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockOnAuthStateChange.mockReset();
    mockUnsubscribe.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading state initially", () => {
    mockGetUser.mockReturnValue(new Promise(() => {}));
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });

    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>,
    );

    expect(screen.getByText("Loading...")).toBeVisible();
  });

  it("renders children when authenticated", async () => {
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });

    let resolveGetUser: (value: {
      data: { user: { id: string } | null };
    }) => void;
    mockGetUser.mockReturnValue(
      new Promise((r) => {
        resolveGetUser = r;
      }),
    );

    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>,
    );

    await act(async () => {
      resolveGetUser!({ data: { user: { id: "123" } } });
    });

    expect(screen.getByText("Protected content")).toBeVisible();
  });

  it("renders nothing when not authenticated", async () => {
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });

    let resolveGetUser: (value: {
      data: { user: { id: string } | null };
    }) => void;
    mockGetUser.mockReturnValue(
      new Promise((r) => {
        resolveGetUser = r;
      }),
    );

    render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>,
    );

    await act(async () => {
      resolveGetUser!({ data: { user: null } });
    });

    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("unsubscribes from auth state changes on unmount", async () => {
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });

    mockGetUser.mockReturnValue(new Promise(() => {}));

    const { unmount } = render(
      <AuthGuard>
        <p>Protected content</p>
      </AuthGuard>,
    );

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});

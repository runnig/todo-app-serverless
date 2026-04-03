import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/login/page";

const mockSignInWithPassword = vi.fn().mockResolvedValue({ error: null });
const mockSignInWithOAuth = vi.fn().mockResolvedValue({ data: null });
const mockSignInWithOtp = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
      signInWithOtp: mockSignInWithOtp,
    },
  }),
}));

vi.mock("@/lib/env", () => ({
  getClientEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
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

describe("LoginPage", () => {
  beforeEach(() => {
    mockSignInWithPassword.mockClear();
    mockSignInWithOAuth.mockClear();
    mockSignInWithOtp.mockClear();
    mockPush.mockClear();
    mockRefresh.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders Google and GitHub OAuth buttons", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: /continue with github/i }),
    ).toBeVisible();
  });

  it("clicking Google calls signInWithOAuth with google provider", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "http://localhost:3000/auth/callback" },
    });
  });

  it("clicking GitHub calls signInWithOAuth with github provider", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(
      screen.getByRole("button", { name: /continue with github/i }),
    );

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: "github",
      options: { redirectTo: "http://localhost:3000/auth/callback" },
    });
  });

  it("toggles magic link mode — password disappears, submit text changes", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    expect(screen.getByLabelText(/password/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /^log in$/i })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /send magic link/i }));

    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send login link/i }),
    ).toBeVisible();
  });

  it("submits magic link via signInWithOtp", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /send magic link/i }));

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send login link/i }));

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: "test@example.com",
      options: {
        emailRedirectTo: "http://localhost:3000/auth/callback",
      },
    });
  });

  it("shows check-your-email screen after magic link is sent", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /send magic link/i }));
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send login link/i }));

    expect(
      screen.getByText(/we sent a login link to your email address/i),
    ).toBeVisible();
  });
});

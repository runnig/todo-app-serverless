import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupPage from "@/app/signup/page";

const mockSignUp = vi.fn().mockResolvedValue({ error: null });
const mockSignInWithOAuth = vi.fn().mockResolvedValue({ data: null });

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
      signInWithOAuth: mockSignInWithOAuth,
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

describe("SignupPage", () => {
  beforeEach(() => {
    mockSignUp.mockClear();
    mockSignInWithOAuth.mockClear();
    mockPush.mockClear();
    mockRefresh.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders Google and GitHub OAuth buttons", () => {
    render(<SignupPage />);
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: /continue with github/i }),
    ).toBeVisible();
  });

  it("clicking Google calls signInWithOAuth with google provider", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "http://localhost:3000/auth/callback" },
    });
  });

  it("after signup success, shows check-your-email confirmation message", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));

    expect(
      screen.getByText(/check your email to confirm your account/i),
    ).toBeVisible();
  });

  it("after signup, does NOT call router.push", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /^sign up$/i }));

    expect(mockPush).not.toHaveBeenCalled();
  });
});

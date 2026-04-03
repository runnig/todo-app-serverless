import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockExchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  }),
}));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to / on successful code exchange", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import("@/app/auth/callback/route");

    const req = new NextRequest(
      "http://localhost:3000/auth/callback?code=valid-code",
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/");
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("valid-code");
  });

  it("redirects to /login with error when code is missing", async () => {
    const { GET } = await import("@/app/auth/callback/route");

    const req = new NextRequest("http://localhost:3000/auth/callback");
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname + location.search).toBe(
      "/login?error=auth_callback_failed",
    );
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("redirects to /login with error when code exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: { message: "Invalid code" },
    });
    const { GET } = await import("@/app/auth/callback/route");

    const req = new NextRequest(
      "http://localhost:3000/auth/callback?code=bad-code",
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname + location.search).toBe(
      "/login?error=auth_callback_failed",
    );
  });
});

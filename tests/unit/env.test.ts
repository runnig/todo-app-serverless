import { describe, it, expect, vi, beforeEach } from "vitest";

describe("getServerEnv", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
    process.env.DATABASE_URL = "postgresql://test:test@localhost:54322/test";
  });

  it("requires NEXT_PUBLIC_APP_URL", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const { getServerEnv } = await import("@/lib/env");
    expect(() => getServerEnv()).toThrow();
  });

  it("returns NEXT_PUBLIC_APP_URL when set", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    const { getServerEnv } = await import("@/lib/env");
    const env = getServerEnv();
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });
});

describe("getClientEnv", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
  });

  it("returns NEXT_PUBLIC_APP_URL when set", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    const { getClientEnv } = await import("@/lib/env");
    const env = getClientEnv();
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });
});

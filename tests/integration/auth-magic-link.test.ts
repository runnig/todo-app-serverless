import { describe, it, expect } from "vitest";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe("Magic link auth flow", () => {
  it("sends a magic link email for a valid email address", async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const testEmail = `magic-link-test-${Date.now()}@example.com`;

    const { error } = await supabase.auth.signInWithOtp({
      email: testEmail,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
      },
    });

    expect(error).toBeNull();
  });

  it("rejects an empty email", async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error } = await supabase.auth.signInWithOtp({
      email: "",
    });

    expect(error).not.toBeNull();
  });
});

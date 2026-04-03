import { describe, it, expect } from "vitest";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe("Email confirmation signup flow", () => {
  it("signs up a user and requires email confirmation", async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const testEmail = `confirm-test-${Date.now()}@example.com`;

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: "testpassword123",
    });

    expect(error).toBeNull();
    expect(data.user).not.toBeNull();
    expect(data.user?.email).toBe(testEmail);
  });

  it("cannot sign in before email confirmation", async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const testEmail = `unconfirmed-${Date.now()}@example.com`;

    await supabase.auth.signUp({
      email: testEmail,
      password: "testpassword123",
    });

    const { error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: "testpassword123",
    });

    expect(error).not.toBeNull();
  });
});

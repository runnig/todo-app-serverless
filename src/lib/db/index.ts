import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getServerEnv } from "@/lib/env";

const connectionString = getServerEnv().DATABASE_URL;

const client = postgres(connectionString);

export const db = drizzle(client, { schema });

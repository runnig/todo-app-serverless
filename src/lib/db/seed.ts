import "dotenv/config";
import { db } from "./index";
import { profiles, todos } from "./schema";

async function seed() {
  console.log("Seeding database...");

  const [user1, user2] = await db
    .insert(profiles)
    .values([
      {
        id: "00000000-0000-0000-0000-000000000001",
        email: "alice@example.com",
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        email: "bob@example.com",
      },
    ])
    .returning();

  await db.insert(todos).values([
    {
      userId: user1.id,
      title: "Buy groceries",
      description: "Milk, eggs, bread",
      done: false,
    },
    {
      userId: user1.id,
      title: "Finish project",
      description: "Complete the TODO app",
      done: true,
    },
    {
      userId: user2.id,
      title: "Read documentation",
      description: "Drizzle ORM docs",
      done: false,
    },
  ]);

  console.log("Seed complete.");
  process.exit(0);
}

seed();

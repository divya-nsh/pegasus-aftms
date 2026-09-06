import db from "#/db/db.js";
import { userTable } from "#/db/schema.js";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

export async function ensureDefaultAdmin() {
  const [existing] = await db
    .select({ id: userTable.id, password: userTable.password })
    .from(userTable)
    .where(eq(userTable.username, "admin"))
    .limit(1);

  const hashedPassword = await bcrypt.hash("admin", 10);

  if (!existing) {
    await db.insert(userTable).values({
      username: "admin",
      password: hashedPassword,
      isActive: true,
    });
    console.log("Seeded default user: admin / admin");
    return;
  }

  const isBcryptHash = existing.password?.startsWith("$2");
  if (!isBcryptHash) {
    await db
      .update(userTable)
      .set({ password: hashedPassword })
      .where(eq(userTable.id, existing.id));
  }
}

import db from "#/db/db.js";
import { userTable } from "#/db/schema.js";
import { DEFAULT_ADMIN_ROLE } from "#/config/roles.js";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

export async function ensureDefaultAdmin() {
  const [existing] = await db
    .select({
      id: userTable.id,
      password: userTable.password,
      role: userTable.role,
    })
    .from(userTable)
    .where(eq(userTable.username, "admin"))
    .limit(1);

  const hashedPassword = await bcrypt.hash("admin", 10);

  if (!existing) {
    await db.insert(userTable).values({
      username: "admin",
      password: hashedPassword,
      isActive: true,
      role: DEFAULT_ADMIN_ROLE,
    });
    console.log("Seeded default user: admin / admin");
    return;
  }

  const updates: { password?: string; role?: string } = {};
  if (!existing.password?.startsWith("$2")) {
    updates.password = hashedPassword;
  }
  if (!existing.role) {
    updates.role = DEFAULT_ADMIN_ROLE;
  }

  if (Object.keys(updates).length > 0) {
    await db
      .update(userTable)
      .set(updates)
      .where(eq(userTable.id, existing.id));
  }
}

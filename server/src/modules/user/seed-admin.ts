import db from "#/db/db.js";
import { userTable } from "#/db/schema.js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import roleService, { SUPER_ADMIN_ROLE_NAME } from "../role/role.service.js";
import { TRPCError } from "@trpc/server";

export async function ensureDefaultAdmin() {
  const [existing] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.username, "admin"))
    .limit(1);

  const hashedPassword = await bcrypt.hash("admin", 10);

  const role = await roleService.getByName(SUPER_ADMIN_ROLE_NAME);
  if (!role) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to seed default admin: Role with name ${SUPER_ADMIN_ROLE_NAME} not found`,
    });
  }

  if (!existing) {
    await db.insert(userTable).values({
      username: "admin",
      password: hashedPassword,
      isActive: true,
      roleId: role.id,
    });
    console.log("✨ Seeded default user: admin / admin");
    return;
  }

  const updates: { password?: string; roleId?: number } = {};
  if (!existing.password?.startsWith("$2")) {
    updates.password = hashedPassword;
  }
  if (!existing.roleId) {
    updates.roleId = role.id;
  }

  if (Object.keys(updates).length > 0) {
    await db
      .update(userTable)
      .set(updates)
      .where(eq(userTable.id, existing.id));
  }
}

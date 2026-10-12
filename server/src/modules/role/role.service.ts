import db from "#/db/db.js";
import { roleTable, runWithCtx } from "#/db/schema.js";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { PERMISSIONS_SET, type TPermissionKey } from "./permissions.js";
import { createdMeta, updatedMeta } from "#/lib/utils.js";

type TCreateRole = {
  name: string;
  permissions: string[];
};

export const SUPER_ADMIN_ROLE_NAME = "SuperAdmin";
export const TRAINEE_ROLE_NAME = "Trainee";

const SYSTEM_ROLES: {
  name: string;
  permissions: TPermissionKey[];
  description?: string;
}[] = [
  {
    name: SUPER_ADMIN_ROLE_NAME,
    permissions: ["*"],
    description: "Full System Access",
  },
  { name: TRAINEE_ROLE_NAME, permissions: ["eventSchedule.read"] },
];

const roleService = new (class {
  constructor() {}
  async getAll() {
    const roles = await db.select().from(roleTable);
    return roles;
  }

  async getById(id: number) {
    const role = await db.select().from(roleTable).where(eq(roleTable.id, id));
    return role;
  }

  async getByName(name: string) {
    const [role] = await db
      .select()
      .from(roleTable)
      .where(eq(roleTable.name, name))
      .limit(1);
    return role;
  }

  // ---------- Mutations ---------------------------

  async create(payload: TCreateRole, userId: number) {
    const { name, permissions } = payload;

    this.validatePermissions(permissions);

    const role = await db
      .insert(roleTable)
      .values({ name, permissions, ...createdMeta(userId) });
    return role;
  }

  async update(id: number, payload: TCreateRole, userId: number) {
    await this.assertNotSystemRole(id);
    const { name, permissions } = payload;
    this.validatePermissions(permissions);
    const role = await db
      .update(roleTable)
      .set({ name, permissions, ...updatedMeta(userId) })
      .where(eq(roleTable.id, id));
    return role;
  }

  async delete(id: number) {
    await this.assertNotSystemRole(id);
    const role = await db.delete(roleTable).where(eq(roleTable.id, id));
    return role;
  }

  async populate() {
    for (const systemRole of SYSTEM_ROLES) {
      const existingRole = await db
        .select()
        .from(roleTable)
        .where(eq(roleTable.name, systemRole.name));
      if (existingRole.length > 0) continue;
      await runWithCtx(null, () =>
        db.insert(roleTable).values({
          ...systemRole,
          isSystem: true,
          // Null means created by system
          createdById: null,
          updatedById: null,
        }),
      );
    }
  }

  //  ---------- Helper Methods ---------------------------
  async assertNotSystemRole(id: number) {
    const [role] = await this.getById(id);
    if (!role) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Role not found",
      });
    }
    if (role.isSystem) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "System roles cannot be modified",
      });
    }
  }

  validatePermissions(permissions: string[]) {
    permissions.forEach((permission) => {
      if (!PERMISSIONS_SET.has(permission)) {
        throw new Error(`Invalid permission: ${permission} not allowed`);
      }
    });
  }

  // Utility Takes Role Name and Permissions and Returns True if the Role Has the Permissions
  async can(rolePermissions: string[], action: string) {
    if (rolePermissions.includes("*")) return true;
    return rolePermissions.includes(action);
  }
})();

export default roleService;

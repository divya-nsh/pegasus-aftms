import db, { type DBTransaction } from "#/db/db.js";
import { userTable } from "#/db/schema.js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createdMeta, updatedMeta } from "#/lib/utils.js";

type TCreateUser = {
  username: string;
  password: string;
  email?: string;
  name?: string | null;
  isActive: boolean;
  roleId?: number | null;
};

const hashPassword = async (password: string) => {
  return bcrypt.hashSync(password, 10);
};

const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compareSync(password, hash);
};

class UserService {
  async createUser(
    values: TCreateUser,
    createdById: number | null,
    tx?: DBTransaction,
  ) {
    const password = await hashPassword(values.password);
    const user = await (tx ?? db)
      .insert(userTable)
      .values({
        username: values.username,
        password,
        email: values.email,
        name: values.name ?? "",
        isActive: values.isActive,
        roleId: values.roleId ?? null,
        ...createdMeta(createdById),
      })
      .returning({ id: userTable.id });
    return user;
  }

  async updateUser(
    id: number,
    values: Partial<TCreateUser>,
    updatedById: number,
    tx?: DBTransaction,
  ) {
    const password = values.password
      ? await hashPassword(values.password)
      : undefined;
    const [updated] = await (tx ?? db)
      .update(userTable)
      .set({
        username: values.username,
        password,
        email: values.email,
        name: values.name,
        isActive: values.isActive ?? undefined,
        roleId: values.roleId ?? undefined,
        ...updatedMeta(updatedById),
      })
      .where(eq(userTable.id, id))
      .returning();

    if (!updated) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return updated;
  }

  async validateCredintials(username: string, password: string) {
    const [user] = await db
      .select({
        id: userTable.id,
        password: userTable.password,
        active: userTable.isActive,
      })
      .from(userTable)
      .where(eq(userTable.username, username))
      .limit(1);

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid username or password",
      });
    }

    const isValid =
      user.password && (await comparePassword(password, user.password));

    if (!isValid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid username or password",
      });
    }

    if (!user.active) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Your account is not active",
      });
    }

    return user.id;
  }

  async getById(id: number) {
    const user = await db.query.userTable.findFirst({
      columns: {
        id: true,
        username: true,
        lastLoginAt: true,
        passwordChangedAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        name: true,
      },
      with: {
        personnel: {
          columns: {
            id: true,
            imageId: true,
            code: true,
            firstName: true,
            lastName: true,
            personnelType: true,
          },
        },
        role: {
          columns: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
      where: {
        id: id,
      },
    });

    return user;
  }

  async getUserRole(userId: number) {
    const row = await db.query.userTable.findFirst({
      columns: {},
      with: {
        role: {
          columns: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
      where: {
        id: userId,
      },
    });

    return row?.role;
  }
}

const userService = new UserService();

export default userService;

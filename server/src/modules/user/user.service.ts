import db, { type DBTransaction } from "#/db/db.js";
import { userTable } from "#/db/schema.js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

type TCreateUser = {
  username: string;
  password: string;
  email?: string;
  name: string;
  isActive: boolean;
  roleId: number;
};

const hashPassword = async (password: string) => {
  return bcrypt.hashSync(password, 10);
};

const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compareSync(password, hash);
};

class UserService {
  async createUser(values: TCreateUser, tx?: DBTransaction) {
    const user = await (tx ?? db)
      .insert(userTable)
      .values({
        username: values.username,
        password: await hashPassword(values.password),
        email: values.email,
        name: values.name,
        isActive: values.isActive,
        roleId: values.roleId,
      })
      .returning();
    return user;
  }

  async updateUser(
    id: number,
    values: Partial<TCreateUser>,
    tx?: DBTransaction,
  ) {
    await (tx ?? db)
      .update(userTable)
      .set({
        username: values.username,
        password: values.password
          ? await hashPassword(values.password)
          : undefined,
        email: values.email,
        name: values.name,
        isActive: values.isActive ?? undefined,
        roleId: values.roleId ?? undefined,
      })
      .where(eq(userTable.id, id))
      .returning();
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

import db, { type DBTransaction } from "#/db/db.js";
import { userTable } from "#/db/schema.js";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

type TCreateUser = {
  username: string;
  password: string;
  email?: string;
  name: string;
  isActive: boolean;
  role?: "trainee" | "instructor" | "admin";
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
        role: values.role,
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
        role: values.role ?? undefined,
      })
      .where(eq(userTable.id, id))
      .returning();
  }

  async getByUserPassword(username: string, password: string) {
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.username, username))
      .limit(1);
    if (!user) return null;

    const isValid =
      user.password && (await comparePassword(password, user.password));
    return isValid ? user : null;
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
        role: true,
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
      },
      where: {
        id: id,
      },
    });

    return user;
  }
}

const userService = new UserService();

export default userService;

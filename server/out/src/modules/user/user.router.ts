import db from "#/db/db.js";
import { userTable } from "#/db/schema.js";
import { protectedProcedure, router } from "#/trpc.js";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcrypt";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import userService from "./user.service.js";

const roleSchema = z.enum(["admin", "instructor", "trainee"]).nullable();

const createSchema = z.object({
  username: z.string().trim().min(1).max(60),
  password: z.string().min(1),
  isActive: z.boolean().default(true),
  name: z.string().trim().max(255).nullable().optional(),
  role: roleSchema.optional(),
});

const updateSchema = z.object({
  toEditId: z.number(),
  username: z.string().trim().min(1).max(60),
  password: z.string().optional(),
  isActive: z.boolean(),
  name: z.string().trim().max(255).nullable().optional(),
  role: roleSchema.optional(),
});

const deleteSchema = z.object({
  toDeleteId: z.number(),
});

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

const userRouter = router({
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    return userService.getById(ctx.user.id);
  }),

  getAll: protectedProcedure.query(async () => {
    console.time("getAllUsers");
    const users = await db.query.userTable.findMany({
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
            code: true,
            firstName: true,
            lastName: true,
            personnelType: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    console.timeEnd("getAllUsers");

    return {
      items: users,
      totalCount: users.length,
    };
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const user = await userService.getById(input.id);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      return user;
    }),

  isUsernameExists: protectedProcedure
    .input(z.object({ username: z.string(), excludeId: z.number().optional() }))
    .query(async ({ input }) => {
      const [user] = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(
          and(
            sql`lower(${userTable.username}) = ${input.username.toLowerCase()}`,
            input.excludeId ? ne(userTable.id, input.excludeId) : undefined,
          ),
        )
        .limit(1);

      return user?.id ?? false;
    }),

  create: protectedProcedure.input(createSchema).mutation(async ({ input }) => {
    const password = await hashPassword(input.password);
    const user = await db
      .insert(userTable)
      .values({
        username: input.username,
        password,
        isActive: input.isActive,
        name: input.name || null,
        role: input.role ?? null,
      })
      .returning({ id: userTable.id });
    return user;
  }),

  update: protectedProcedure.input(updateSchema).mutation(async ({ input }) => {
    const { toEditId, password, ...data } = input;
    const nextPassword = password?.trim();

    const user = await db
      .update(userTable)
      .set({
        username: data.username,
        isActive: data.isActive,
        name: data.name || null,
        role: data.role ?? null,
        ...(nextPassword
          ? {
              password: await hashPassword(nextPassword),
              passwordChangedAt: new Date(),
            }
          : {}),
      })
      .where(eq(userTable.id, toEditId))
      .returning({ id: userTable.id });

    if (user.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  delete: protectedProcedure
    .input(deleteSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.toDeleteId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete your own account",
        });
      }

      const user = await db
        .delete(userTable)
        .where(eq(userTable.id, input.toDeleteId))
        .returning({ id: userTable.id });

      if (user.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),
});

export default userRouter;

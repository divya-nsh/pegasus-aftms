import db from "#/db/db.js";
import { userTable } from "#/db/schema.js";
import { protectedProcedure, router } from "#/trpc.js";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import userService from "./user.service.js";
import roleService from "../role/role.service.js";
import { withAuditColumns } from "#/db/query-utilts.js";

const createSchema = z.object({
  username: z.string().trim().min(1).max(60),
  password: z.string().min(1),
  isActive: z.boolean().default(true),
  name: z.string().trim().max(255).nullable().default(""),
  roleId: z.number().nullable().default(null),
});

const updateSchema = z.object({
  toEditId: z.number(),
  username: z.string().trim().min(1).max(60),
  password: z.string().optional(),
  isActive: z.boolean(),
  name: z.string().trim().max(255).nullable().default(""),
  roleId: z.number().nullable().default(null),
});

const deleteSchema = z.object({
  toDeleteId: z.number(),
});

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

const userRouter = router({
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await userService.getById(ctx.user.id);
    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not authorized to access this resource",
      });
    }

    return user;
  }),

  getAll: protectedProcedure.query(async () => {
    console.time("getAllUsers");
    const users = await db.query.userTable.findMany({
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
        role: {
          columns: {
            id: true,
            name: true,
          },
        },
        ...withAuditColumns(),
      },
      orderBy: { id: "desc" },
    });

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

  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ input, ctx }) => {
      return userService.createUser(input, ctx.user.id);
    }),

  update: protectedProcedure
    .input(updateSchema)
    .mutation(async ({ input, ctx }) => {
      const { toEditId, password, ...data } = input;
      return userService.updateUser(toEditId, data, ctx.user.id);
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

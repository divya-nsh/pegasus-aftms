import db from "#/db/db.js";
import { personnelTable, userTable } from "#/db/schema.js";
import { DEFAULT_TRAINEE_ROLE } from "#/config/roles.js";
import { protectedProcedure, router } from "#/trpc.js";
import { pilotQualifications } from "@repo/shared";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { mediaService } from "../media/media.service.js";
import userService from "../user/user.service.js";

const optionalText = z.string().optional();

function optionalDate(value?: string) {
  return value && value.trim() !== "" ? value : null;
}

const createSchema = z.object({
  personnelType: z.enum(["pilot", "trainee", "instructor"]),
  batchNo: optionalText,
  code: optionalText,
  firstName: z.string().min(1),
  lastName: optionalText,
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: optionalText,
  dateOfJoin: optionalText,
  rank: optionalText,
  qualification: z.preprocess(
    (value) => (value === "" ? null : value),
    z
      .enum(pilotQualifications.map((qualification) => qualification.id))
      .nullable()
      .optional(),
  ),
  phone: optionalText,
  email: optionalText,
  address: optionalText,
  medicalStatus: z.enum(["fit", "unfit", "pending"]).default("pending"),
  medicalExamDate: optionalText,
  medicalValidUntil: optionalText,
  imageId: z.int().nullable().optional(),
  isCreateUser: z.boolean().optional(),
  newUserUsername: z.string().optional(),
  newUserPassword: z.string().optional(),
});

const updateSchema = createSchema.extend({
  toEditId: z.number(),
});

const deleteSchema = z.object({
  toDeleteId: z.number(),
});

type DBTransaction = Parameters<Parameters<(typeof db)["transaction"]>[0]>[0];

function personnelValues(input: z.infer<typeof createSchema>) {
  const {
    isCreateUser: _isCreateUser,
    newUserUsername: _username,
    newUserPassword: _password,
    ...data
  } = input;

  return {
    ...data,
    dateOfBirth: optionalDate(data.dateOfBirth),
    dateOfJoin: optionalDate(data.dateOfJoin),
    medicalExamDate: optionalDate(data.medicalExamDate),
    medicalValidUntil: optionalDate(data.medicalValidUntil),
    qualification: data.qualification || null,
    imageId: data.imageId ?? null,
  };
}

async function createLinkedUser(
  tx: DBTransaction,
  input: {
    username?: string | undefined;
    email?: string | undefined;
    password?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
  },
) {
  const username = input.username?.trim();
  const password = input.password?.trim();
  const email = input.email?.trim() || null;

  if (!username) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Username is required to create a user account",
    });
  }

  if (!email) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Email is required to create a user account",
    });
  }

  if (!password) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Password is required to create a user account",
    });
  }

  const [existingUsername] = await tx
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.username, username))
    .limit(1);

  if (existingUsername) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "A user with this username already exists",
    });
  }

  // if (email) {
  //   const [existingEmail] = await tx
  //     .select({ id: userTable.id })
  //     .from(userTable)
  //     .where(eq(userTable.email, email))
  //     .limit(1);

  //   if (existingEmail) {
  //     throw new TRPCError({
  //       code: "CONFLICT",
  //       message: "A user with this email already exists",
  //     });
  //   }
  // }

  const [user] = await userService.createUser(
    {
      username,
      // email,
      name: `${input.firstName} ${input.lastName}`,
      password,
      isActive: true,
      role: DEFAULT_TRAINEE_ROLE,
    },
    tx,
  );

  return user!.id;
}

const personnelRouter = router({
  getAll: protectedProcedure.query(async () => {
    const personnel = await db
      .select()
      .from(personnelTable)
      .orderBy(desc(personnelTable.id));

    return {
      items: personnel,
      totalCount: personnel.length,
    };
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [row] = await db
        .select({
          person: personnelTable,
          userUsername: userTable.username,
          userIsActive: userTable.isActive,
        })
        .from(personnelTable)
        .leftJoin(userTable, eq(personnelTable.userId, userTable.id))
        .where(eq(personnelTable.id, input.id));

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Personnel not found",
        });
      }

      return {
        ...row.person,
        user: row.person.userId
          ? {
              username: row.userUsername ?? "",
              isActive: row.userIsActive ?? false,
            }
          : null,
      };
    }),

  create: protectedProcedure.input(createSchema).mutation(async ({ input }) => {
    const res = await db.transaction(async (tx) => {
      const [person] = await tx
        .insert(personnelTable)
        .values(personnelValues(input))
        .returning({ id: personnelTable.id });

      if (!person) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create personnel",
        });
      }

      if (input.isCreateUser) {
        const userId = await createLinkedUser(tx, {
          username: input.newUserUsername,
          email: input.email,
          password: input.newUserPassword,
          firstName: input.firstName,
          lastName: input.lastName,
        });

        await tx
          .update(personnelTable)
          .set({ userId })
          .where(eq(personnelTable.id, person.id));
      }

      if (input.imageId) {
        // Activate Media to prevent automatic deletion
        await mediaService.activateMedia(input.imageId, tx);
      }

      return person;
    });

    return res;
  }),

  update: protectedProcedure.input(updateSchema).mutation(async ({ input }) => {
    const {
      toEditId,
      isCreateUser,
      newUserUsername,
      newUserPassword,
      ...data
    } = input;

    await db.transaction(async (tx) => {
      const [oldData] = await tx
        .select({
          imageId: personnelTable.imageId,
          userId: personnelTable.userId,
          firstName: personnelTable.firstName,
          lastName: personnelTable.lastName,
        })
        .from(personnelTable)
        .where(eq(personnelTable.id, toEditId))
        .limit(1);

      if (!oldData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Personnel not found",
        });
      }

      const nextImageId = input.imageId ?? null;
      if (oldData.imageId !== nextImageId) {
        if (oldData.imageId) {
          await mediaService.markForDeletion(oldData.imageId, tx);
        }
        if (nextImageId) {
          await mediaService.activateMedia(nextImageId, tx);
        }
      }

      let nextUserId = oldData.userId;
      if (isCreateUser && !oldData.userId) {
        nextUserId = await createLinkedUser(tx, {
          username: newUserUsername,
          email: data.email,
          password: newUserPassword,
          firstName: data.firstName,
          lastName: data.lastName,
        });
      }

      if (oldData.userId) {
        // Keep name in sync with personnel
        await userService.updateUser(
          oldData.userId,
          {
            name: `${data.firstName ?? oldData.firstName} ${data.lastName ?? oldData.lastName}`,
          },
          tx,
        );
      }

      const person = await tx
        .update(personnelTable)
        .set({
          ...personnelValues(data),
          imageId: nextImageId,
          userId: nextUserId,
        })
        .where(eq(personnelTable.id, toEditId))
        .returning({ id: personnelTable.id });

      if (person.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Personnel not found",
        });
      }
    });
  }),

  delete: protectedProcedure.input(deleteSchema).mutation(async ({ input }) => {
    await db.transaction(async (tx) => {
      const person = await tx
        .delete(personnelTable)
        .where(eq(personnelTable.id, input.toDeleteId))
        .returning({ id: personnelTable.id, imageId: personnelTable.imageId });

      if (person.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Personnel not found",
        });
      }

      if (person[0]?.imageId) {
        await mediaService.markForDeletion(person[0].imageId, tx);
      }

      return person;
    });
  }),
});

export default personnelRouter;

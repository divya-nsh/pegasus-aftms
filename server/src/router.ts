import type { inferRouterOutputs } from "@trpc/server";
import aircraftRouter from "./modules/aircraft/aircraft.router.js";
import areaMasterRouter from "./modules/area/area.router.js";
import locationsRouter from "./modules/location/location.router.js";
import missionRouter from "./modules/mission/mission.router.js";
import personnelRouter from "./modules/personnel/personnel.router.js";
import scheduleRouter from "./modules/schedule/schedule.router.js";
import { protectedProcedure, publicProcedure, router } from "./trpc.js";
import z from "zod";
import { TRPCError } from "@trpc/server";
import userRouter from "./modules/user/user.router.js";
import db from "./db/db.js";
import { userTable } from "./db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import mediaRouter from "./modules/media/media.router.js";

export const appRouter = router({
  hello: protectedProcedure.query(() => {
    return "Hello from the server";
  }),
  locations: locationsRouter,
  areas: areaMasterRouter,
  aircraft: aircraftRouter,
  personnel: personnelRouter,
  missions: missionRouter,
  schedules: scheduleRouter,
  users: userRouter,
  media: mediaRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    login: publicProcedure
      .input(
        z.object({
          username: z.string().min(1),
          password: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const [user] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.username, input.username))
          .limit(1);

        if (user && !user.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Please Setup your account password first",
          });
        }

        const passwordMatches = user
          ? await bcrypt.compare(input.password, user.password!)
          : false;

        if (!user || !passwordMatches) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid username or password",
          });
        }

        if (!user.isActive) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Your account is not active",
          });
        }

        await db
          .update(userTable)
          .set({ lastLoginAt: new Date() })
          .where(eq(userTable.id, user.id));

        await ctx.login({ id: user.id, username: user.username });

        return {
          success: true,
          user: { id: user.id, username: user.username },
        };
      }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      await ctx.logout();
      return { success: true };
    }),
  }),
});

// @ts-expect-error
const isBrowser = typeof window !== "undefined";

if (isBrowser) {
  throw new Error("ALERT: Server Code Bundle into the client Code");
}

export type AppRouter = typeof appRouter;

export type TrpcRouterOutputs = inferRouterOutputs<typeof appRouter>;

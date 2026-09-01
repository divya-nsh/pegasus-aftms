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
import mediaRouter from "./modules/media/media.router.js";
import roleRouter from "./modules/role/role.router.js";
import userService from "./modules/user/user.service.js";

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
  roles: roleRouter,
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
        const userId = await userService.validateCredintials(
          input.username,
          input.password,
        );

        const user = (await userService.getById(userId))!;

        await ctx.login({
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name || user.username,
          personnelId: user.personnel[0]?.id ?? null,
        });

        return { success: true };
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

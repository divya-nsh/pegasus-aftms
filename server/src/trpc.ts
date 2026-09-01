import { initTRPC, TRPCError } from "@trpc/server";
import type * as trpcExpress from "@trpc/server/adapters/express";
import type { SessionData } from "express-session";
import { SESSION_COOKIE_NAME } from "./config/constants.js";

type SessionUser = NonNullable<SessionData["user"]>;

type TrpcContext = {
  user: SessionUser | null;
  login: (user: SessionUser) => Promise<void>;
  logout: () => Promise<void>;
};

export function createContext({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions): TrpcContext {
  const user: SessionUser | null = req.session.user ?? null;

  const login = (nextUser: SessionUser) =>
    new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) {
          reject(err);
          return;
        }

        req.session.user = nextUser;
        req.session.save((saveErr) => {
          if (saveErr) {
            reject(saveErr);
            return;
          }
          resolve();
        });
      });
    });

  const logout = () =>
    new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject(err);
          return;
        }
        res.clearCookie(SESSION_COOKIE_NAME);
        resolve();
      });
    });

  return { user, login, logout };
}

const t = initTRPC.context<TrpcContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to do that",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

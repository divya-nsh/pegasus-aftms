import { initTRPC, TRPCError } from "@trpc/server";
import type * as trpcExpress from "@trpc/server/adapters/express";
import type { SessionData } from "express-session";
import { SESSION_COOKIE_NAME } from "./config/constants.js";
import { prettifyError, ZodError } from "zod";

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

const t = initTRPC.context<TrpcContext>().create({
  errorFormatter: ({ error, shape }) => {
    if (error instanceof ZodError) {
      shape.message = prettifyError(error);
    }
    return shape;
  },
});

const PG_ERRORS: Record<string, { code: TRPCError["code"]; message: string }> =
  {
    "23503": {
      code: "BAD_REQUEST",
      message: "DB ERROR: Referenced record does not exist or is still in use.",
    },
    "23505": {
      code: "CONFLICT",
      message: "DB ERROR: This record already exists.",
    },
    "23502": {
      code: "BAD_REQUEST",
      message: "DB ERROR: A required field is missing.",
    },
    "23514": {
      code: "BAD_REQUEST",
      message: "DB ERROR: Value violates a check constraint.",
    },
    "22P02": {
      code: "BAD_REQUEST",
      message: "DB ERROR: Invalid value format.",
    },
  };

function getFields(pg: any): string[] {
  if (pg?.column ?? pg?.column_name) return [pg.column ?? pg.column_name]; // not-null case

  // "Key (a, b)=(1, 2) ..." -> ['a', 'b']
  const match = pg?.detail?.match(/^Key \((.+?)\)=/);
  return match ? match[1].split(", ") : [];
}

const drizzleErrors = t.middleware(async ({ next }) => {
  const res = await next();
  if (res.ok) return res;

  const e = res.error.cause as any;
  const pg = e?.cause?.code ? e.cause : e; // unwrap DrizzleQueryError
  const mapped = PG_ERRORS[pg?.code];
  if (!mapped) return res;

  // FK error caused by deleting/updating a record that other records point to
  if (pg.code === "23503" && pg.detail?.includes("is still referenced")) {
    const table = pg.detail.match(/from table "(.+?)"/)?.[1];
    throw new TRPCError({
      code: "CONFLICT",
      message: table
        ? `DB FK Constraint Error: Cannot delete Record which is being refrenced by other records in "${table}".`
        : "DB FK Constraint Error: Cannot delete, it is still used by other records.",
      cause: res.error.cause,
    });
  }

  const fields = getFields(pg);
  const message = fields.length
    ? `${mapped.message} (${fields.join(", ")})`
    : mapped.message;

  throw new TRPCError({ code: mapped.code, message, cause: res.error.cause });
});

const baseProcedure = t.procedure.use(drizzleErrors);

export const router = t.router;
export const publicProcedure = baseProcedure;

export const protectedProcedure = baseProcedure.use(({ ctx, next }) => {
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

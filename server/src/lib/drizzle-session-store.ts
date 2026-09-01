import type db from "#/db/db.js";
import { sessionTable } from "#/db/schema.js";
import { Store, type SessionData } from "express-session";
import { and, eq, gt, lt } from "drizzle-orm";

type Database = typeof db;

const PRUNE_INTERVAL_IN_MINUTES = 15; // 15 minutes
// const ONE_DAY = 86400;

export class DrizzleSessionStore extends Store {
  constructor(
    private db: Database,
    // IT Represent Session Data Schema Version as its store jsonb schema may change in the future
    public readonly version: number = 1,
  ) {
    super();
    setInterval(
      () => this.pruneSessions(),
      PRUNE_INTERVAL_IN_MINUTES * 60 * 1000,
    );
  }

  async get(
    sid: string,
    callback: (err: any, session?: SessionData | null) => void,
  ) {
    try {
      const [row] = await this.db
        .select()
        .from(sessionTable)
        .where(
          and(
            eq(sessionTable.sid, sid),
            gt(sessionTable.expireAt, new Date()),
            eq(sessionTable.version, this.version),
          ),
        )
        .limit(1);

      if (!row) {
        return callback(null, null);
      }

      callback(null, row.sess as SessionData);
    } catch (error) {
      callback(error);
    }
  }

  async set(sid: string, sess: SessionData, callback?: (err?: any) => void) {
    try {
      //   const userId = sess.user?.id;

      //   if (!userId) {
      //     return callback?.(new Error("Session userId is missing"));
      //   }

      if (!sess.cookie.expires) {
        return callback?.(new Error("Session expiration is missing"));
      }

      const expireAt = new Date(sess.cookie.expires);

      await this.db
        .insert(sessionTable)
        .values({
          sid,
          //   userId,
          sess,
          expireAt,
          version: this.version,
        })
        .onConflictDoUpdate({
          target: sessionTable.sid,
          set: {
            // userId,
            sess,
            expireAt,
            version: this.version,
          },
        });

      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      await this.db.delete(sessionTable).where(eq(sessionTable.sid, sid));
      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }

  private async pruneSessions() {
    try {
      await this.db
        .delete(sessionTable)
        .where(lt(sessionTable.expireAt, new Date()));
    } catch (error) {
      console.error("Error pruning sessions:", error);
    }
  }
}

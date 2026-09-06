import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.js";

export const relations = defineRelations({ ...schema }, (r) => ({
  userTable: {
    personnel: r.many.personnelTable({
      from: r.userTable.id,
      to: r.personnelTable.userId,
    }),
  },
  personnelTable: {
    user: r.one.userTable({
      from: r.personnelTable.userId,
      to: r.userTable.id,
    }),
  },
}));

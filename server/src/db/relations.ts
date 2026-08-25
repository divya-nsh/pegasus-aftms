import { defineRelations } from "drizzle-orm";
import { personnelTable, userTable } from "./schema.js";

export const relations = defineRelations(
  { userTable, personnelTable },
  (r) => ({
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
  }),
);

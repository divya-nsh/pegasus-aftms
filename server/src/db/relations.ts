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
  // missionTable: {
  //   missionSchedule: r.many.missionScheduleTable({
  //     from: r.missionTable.id,
  //     to: r.missionScheduleTable.missionId,
  //   }),
  // },
  missionAssignmentTable: {
    missionSchedule: r.one.missionScheduleTable({
      from: r.missionAssignmentTable.scheduleId,
      to: r.missionScheduleTable.id,
    }),
    personnel: r.one.personnelTable({
      from: r.missionAssignmentTable.personnelId,
      to: r.personnelTable.id,
    }),
    aircraft: r.one.aircraftTable({
      from: r.missionAssignmentTable.aircraftId,
      to: r.aircraftTable.id,
    }),
  },
  missionScheduleTable: {
    mission: r.one.missionTable({
      from: r.missionScheduleTable.missionId,
      to: r.missionTable.id,
    }),
    assignments: r.many.missionAssignmentTable({
      from: r.missionScheduleTable.id,
      to: r.missionAssignmentTable.scheduleId,
    }),
    area: r.one.aircraftTable({
      from: r.missionScheduleTable.areaId,
      to: r.aircraftTable.id,
    }),
  },
}));

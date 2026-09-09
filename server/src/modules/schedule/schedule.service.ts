import db from "#/db/db.js";

export class ScheduleService {
  constructor() {}

  async getScheduleSummaryForPersonnel(personnelId: number) {
    const profile = await db.query.personnelTable.findFirst({
      where: {
        id: personnelId,
      },
    });
    if (!profile) {
      throw new Error("Personnel not found");
    }
    const schedules = await db.query.missionScheduleTable.findMany({
      where: {
        status: {
          notIn: ["draft", "cancelled"],
        },
        assignments: {
          personnelId: personnelId,
        },
      },
      with: {
        assignments: {
          where: {
            personnelId: personnelId,
          },
        },
      },
    });

    const completedMissions = schedules.filter(
      (schedule) => schedule.status === "completed",
    );

    const totalAssignmentsCompleted = schedules.filter(
      (schedule) => schedule.status === "completed",
    ).length;

    const pendingAssignments = schedules.filter(
      (schedule) => schedule.status === "published",
    );

    const averageScore =
      completedMissions.reduce(
        (acc, schedule) => acc + (schedule.assignments?.[0]?.score ?? 0),
        0,
      ) / totalAssignmentsCompleted;

    const passedAssignments = completedMissions.filter(
      (schedule) => schedule.assignments?.[0]?.result === "passed",
    );

    const failedAssignments = completedMissions.filter(
      (schedule) => schedule.assignments?.[0]?.result === "failed",
    );

    return {
      totalAssignments: schedules.length,
      totalAssignmentsCompleted,
      totalAssignmentsPending: pendingAssignments.length,
      averageScore,
      totalPassedAssignments: passedAssignments.length,
      totalFailedAssignments: failedAssignments.length,
      passedPercentage:
        (passedAssignments.length / totalAssignmentsCompleted) * 100,
      failedPercentage:
        (failedAssignments.length / totalAssignmentsCompleted) * 100,
    };
  }
}

const scheduleService = new ScheduleService();

export default scheduleService;

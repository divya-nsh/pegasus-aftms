import db from "#/db/db.js";

export class ScheduleService {
  async getPilotDashboardStats(personnelId: number, todayDateIso: string) {
    const profile = await db.query.personnelTable.findFirst({
      where: { id: personnelId },
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
          personnelId,
        },
      },
      with: {
        mission: true,
        assignments: {
          where: { personnelId },
        },
      },
      orderBy: (table, { desc }) => [desc(table.startDateTime)],
    });

    const today = todayDateIso.slice(0, 10);

    let completedCount = 0;
    let upcomingCount = 0;

    let passedCount = 0;
    let failedCount = 0;
    let pendingResultCount = 0;

    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;

    let scoreTotal = 0;
    let scoredAssignments = 0;

    let flyingMilliseconds = 0;
    let flyingAssignments = 0;

    const todayAssignments = [];

    const missionTypeCount: Record<string, number> = {};

    for (const schedule of schedules) {
      const assignment = schedule.assignments?.[0];
      if (!assignment) continue;

      // Mission type distribution
      const type = schedule.mission?.missionType ?? "unknown";
      missionTypeCount[type] = (missionTypeCount[type] ?? 0) + 1;

      // Upcoming missions
      if (schedule.status === "published") {
        upcomingCount++;

        if (schedule.startDateTime?.toISOString().slice(0, 10) === today) {
          todayAssignments.push(schedule);
        }
      }

      // Completed missions
      if (schedule.status !== "completed") continue;

      completedCount++;

      // Attendance
      switch (assignment.attendanceStatus) {
        case "present":
          presentCount++;
          break;
        case "absent":
          absentCount++;
          break;
        case "excused":
          excusedCount++;
          break;
      }

      // Results
      switch (assignment.result) {
        case "passed":
          passedCount++;
          break;
        case "failed":
          failedCount++;
          break;
        default:
          pendingResultCount++;
      }

      // Average score (ignore null scores)
      if (assignment.score !== null && assignment.score !== undefined) {
        scoreTotal += assignment.score;
        scoredAssignments++;
      }

      // Flying hours
      if (
        assignment.aircraftId &&
        assignment.takeoffTime &&
        assignment.landingTime
      ) {
        flyingAssignments++;
        flyingMilliseconds +=
          assignment.landingTime.getTime() - assignment.takeoffTime.getTime();
      }
    }

    const evaluatedAssignments = passedCount + failedCount;

    return {
      // Overview
      totalAssignments: schedules.length,
      completedAssignments: completedCount,
      pendingAssignments: upcomingCount,

      // Results
      passedAssignments: passedCount,
      failedAssignments: failedCount,
      pendingResults: pendingResultCount,
      passRate:
        evaluatedAssignments === 0
          ? 0
          : Number(((passedCount / evaluatedAssignments) * 100).toFixed(1)),

      // Performance
      averageScore:
        scoredAssignments === 0
          ? null
          : Number((scoreTotal / scoredAssignments).toFixed(1)),

      // Attendance
      attendance: {
        present: presentCount,
        absent: absentCount,
        excused: excusedCount,
      },

      // Flying
      flyingHours: Number((flyingMilliseconds / 3_600_000).toFixed(1)),
      flyingAssignments,

      // Charts / Lists
      missionTypeDistribution: missionTypeCount,
      todayAssignments,
    };
  }
}

export default new ScheduleService();

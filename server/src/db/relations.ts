import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.js";
//Note: We gone only define relations we actualy use in the code. example: we never gone need to fetch gradding template attributes without the grading template.

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

  missionScheduleTable: {
    mission: r.one.missionTable({
      from: r.missionScheduleTable.missionId,
      to: r.missionTable.id,
    }),
    assignments: r.many.missionScheduleParticipantTable({
      from: r.missionScheduleTable.id,
      to: r.missionScheduleParticipantTable.missionScheduleId,
    }),
    area: r.one.areaTable({
      from: r.missionScheduleTable.areaId,
      to: r.areaTable.id,
    }),
  },

  missionScheduleParticipantTable: {
    missionSchedule: r.one.missionScheduleTable({
      from: r.missionScheduleParticipantTable.missionScheduleId,
      to: r.missionScheduleTable.id,
    }),
    personnel: r.one.personnelTable({
      from: r.missionScheduleParticipantTable.personnelId,
      to: r.personnelTable.id,
    }),
    aircraft: r.one.aircraftTable({
      from: r.missionScheduleParticipantTable.aircraftId,
      to: r.aircraftTable.id,
    }),
    obtainedGrade: r.one.gradingScaleOptionTable({
      from: r.missionScheduleParticipantTable.obtainedGradeId,
      to: r.gradingScaleOptionTable.id,
    }),
    participantGradings: r.many.missionScheduleParticipantGradingTable({
      from: r.missionScheduleParticipantTable.id,
      to: r.missionScheduleParticipantGradingTable.missionScheduleParticipantId,
    }),
  },
  missionScheduleParticipantGradingTable: {
    gradingScaleOption: r.one.gradingScaleOptionTable({
      from: r.missionScheduleParticipantGradingTable.gradingScaleOptionId,
      to: r.gradingScaleOptionTable.id,
    }),
    gradingTemplateAttribute: r.one.gradingTemplateAttributeTable({
      from: r.missionScheduleParticipantGradingTable.gradingTemplateAttributeId,
      to: r.gradingTemplateAttributeTable.id,
    }),
  },

  gradingScaleTable: {
    options: r.many.gradingScaleOptionTable({
      from: r.gradingScaleTable.id,
      to: r.gradingScaleOptionTable.gradingScaleId,
    }),
  },
  gradingTemplateTable: {
    gradingScale: r.one.gradingScaleTable({
      from: r.gradingTemplateTable.gradingScaleId,
      to: r.gradingScaleTable.id,
    }),
    gradingTemplateAttributes: r.many.gradingTemplateAttributeTable({
      from: r.gradingTemplateTable.id,
      to: r.gradingTemplateAttributeTable.gradingTemplateId,
    }),
  },
  gradingTemplateAttributeTable: {
    gradingAttribute: r.one.gradingAttributeTable({
      from: r.gradingTemplateAttributeTable.attributeId,
      to: r.gradingAttributeTable.id,
    }),
  },
}));

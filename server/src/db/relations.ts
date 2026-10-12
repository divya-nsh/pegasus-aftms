import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.js";
//Note: We gone only define relations we actualy use in the code. example: we never gone need to fetch gradding template attributes without the grading template.

export const relations = defineRelations({ ...schema }, (r) => ({
  userTable: {
    personnel: r.many.personnelTable({
      from: r.userTable.id,
      to: r.personnelTable.userId,
    }),
    role: r.one.roleTable({
      from: r.userTable.roleId,
      to: r.roleTable.id,
    }),
    createdBy: r.one.userTable({
      from: r.userTable.createdById,
      to: r.userTable.id,
    }),
    updatedBy: r.one.userTable({
      from: r.userTable.updatedById,
      to: r.userTable.id,
    }),
  },
  roleTable: {
    createdBy: r.one.userTable({
      from: r.roleTable.createdById,
      to: r.userTable.id,
    }),
    updatedBy: r.one.userTable({
      from: r.roleTable.updatedById,
      to: r.userTable.id,
    }),
  },
  personnelTable: {
    user: r.one.userTable({
      from: r.personnelTable.userId,
      to: r.userTable.id,
    }),
    createdBy: r.one.userTable({
      from: r.personnelTable.createdById,
      to: r.userTable.id,
    }),
    updatedBy: r.one.userTable({
      from: r.personnelTable.updatedById,
      to: r.userTable.id,
    }),
  },
  missionTable: {
    createdBy: r.one.userTable({
      from: r.missionTable.createdById,
      to: r.userTable.id,
    }),
    updatedBy: r.one.userTable({
      from: r.missionTable.updatedById,
      to: r.userTable.id,
    }),
  },
  aircraftTable: {
    createdBy: r.one.userTable({
      from: r.aircraftTable.createdById,
      to: r.userTable.id,
    }),
    updatedBy: r.one.userTable({
      from: r.aircraftTable.updatedById,
      to: r.userTable.id,
    }),
  },
  mediaTable: {
    createdBy: r.one.userTable({
      from: r.mediaTable.createdById,
      to: r.userTable.id,
    }),
    updatedBy: r.one.userTable({
      from: r.mediaTable.updatedById,
      to: r.userTable.id,
    }),
  },
  locationTable: {
    createdBy: r.one.userTable({
      from: r.locationTable.createdById,
      to: r.userTable.id,
    }),
    updatedBy: r.one.userTable({
      from: r.locationTable.updatedById,
      to: r.userTable.id,
    }),
  },
  areaTable: {
    createdBy: r.one.userTable({
      from: r.areaTable.createdById,
      to: r.userTable.id,
    }),
    updatedBy: r.one.userTable({
      from: r.areaTable.updatedById,
      to: r.userTable.id,
    }),
  },
  gradingAttributeTable: {
    createdBy: r.one.userTable({
      from: r.gradingAttributeTable.createdById,
      to: r.userTable.id,
    }),
    updatedBy: r.one.userTable({
      from: r.gradingAttributeTable.updatedById,
      to: r.userTable.id,
    }),
  },
  gradingScaleOptionTable: {
    createdBy: r.one.userTable({
      from: r.gradingScaleOptionTable.createdById,
      to: r.userTable.id,
    }),
    updatedBy: r.one.userTable({
      from: r.gradingScaleOptionTable.updatedById,
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
    createdBy: r.one.userTable({
      from: r.missionScheduleTable.createdById,
      to: r.userTable.id,
    }),
    updatedBy: r.one.userTable({
      from: r.missionScheduleTable.updatedById,
      to: r.userTable.id,
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
    createdBy: r.one.userTable({
      from: r.missionScheduleParticipantTable.createdById,
      to: r.userTable.id,
    }),
    updatedBy: r.one.userTable({
      from: r.missionScheduleParticipantTable.updatedById,
      to: r.userTable.id,
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
    createdBy: r.one.userTable({
      from: r.missionScheduleParticipantGradingTable.createdById,
      to: r.userTable.id,
    }),
    updatedBy: r.one.userTable({
      from: r.missionScheduleParticipantGradingTable.updatedById,
      to: r.userTable.id,
    }),
  },

  gradingScaleTable: {
    options: r.many.gradingScaleOptionTable({
      from: r.gradingScaleTable.id,
      to: r.gradingScaleOptionTable.gradingScaleId,
    }),
    createdBy: r.one.userTable({
      from: r.gradingScaleTable.createdById,
      to: r.userTable.id,
    }),
    updatedBy: r.one.userTable({
      from: r.gradingScaleTable.updatedById,
      to: r.userTable.id,
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
    createdBy: r.one.userTable({
      from: r.gradingTemplateTable.createdById,
      to: r.userTable.id,
    }),
    updatedBy: r.one.userTable({
      from: r.gradingTemplateTable.updatedById,
      to: r.userTable.id,
    }),
  },
  gradingTemplateAttributeTable: {
    gradingAttribute: r.one.gradingAttributeTable({
      from: r.gradingTemplateAttributeTable.attributeId,
      to: r.gradingAttributeTable.id,
    }),
    createdBy: r.one.userTable({
      from: r.gradingTemplateAttributeTable.createdById,
      to: r.userTable.id,
    }),
    updatedBy: r.one.userTable({
      from: r.gradingTemplateAttributeTable.updatedById,
      to: r.userTable.id,
    }),
  },
}));

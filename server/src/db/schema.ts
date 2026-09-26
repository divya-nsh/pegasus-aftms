import { missionTypes } from "@repo/shared";
import {
  integer,
  snakeCase,
  timestamp,
  varchar,
  pgEnum,
  date,
  index,
  boolean,
  jsonb,
  uniqueIndex,
  numeric,
} from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const personnelTypeEnum = pgEnum("personnel_type", [
  "pilot",
  "trainee",
  "instructor",
]);
export const medicalStatusEnum = pgEnum("medical_status", [
  "fit",
  "unfit",
  "pending",
]);

export const mediaStatusEnum = pgEnum("media_status", [
  "draft",
  "active",
  "archived",
]);

const timeStampts = {
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

export const userTable = snakeCase.table("user", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 60 }).notNull().unique(),
  email: varchar({ length: 255 }).unique(),
  name: varchar({ length: 255 }),
  role: varchar(),
  // null password represents a user that has not set a password yet
  password: varchar(),
  lastLoginAt: timestamp(),
  passwordChangedAt: timestamp(),
  isActive: boolean().notNull().default(true),
  ...timeStampts,
});

export const personnelTable = snakeCase.table("personnel", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  personnelType: personnelTypeEnum().notNull(),
  batchNo: varchar(),
  code: varchar(), //Client id
  firstName: varchar().notNull(),
  lastName: varchar(),
  gender: genderEnum().notNull(),
  dateOfBirth: date(),
  dateOfJoin: date(),
  rank: varchar(),
  qualification: varchar(),
  phone: varchar(),
  email: varchar(),
  address: varchar(),
  imageId: integer().references(() => mediaTable.id),
  medicalStatus: medicalStatusEnum().notNull().default("pending"),
  medicalExamDate: date(),
  medicalValidUntil: date(),
  userId: integer()
    .unique()
    .references(() => userTable.id),
  // primaryAircraftTypeId: integer().references(() => aircraftTypeTable.id),
  ...timeStampts,
});

// export const aircraftTypeTable = snakeCase.table("aircraft_type", {
//   id: integer().primaryKey().generatedAlwaysAsIdentity(),
//   name: varchar().notNull(),
//   notes: varchar(),
//   ...timeStampts,
// });

export const missionStatusEnum = pgEnum("mission_status", [
  "draft",
  "published",
  "completed",
  "cancelled",
  "in_progress",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "excused",
]);

export const missionScheduleStatusEnum = pgEnum("mission_result", [
  "passed",
  "failed",
]);

export const missionTable = snakeCase.table("mission", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar().notNull(),
  description: varchar().default(""),
  aircraftId: integer().references(() => aircraftTable.id),
  gradingTemplateId: integer().references(() => gradingTemplateTable.id),
  durationMinutes: integer().notNull().default(60),
  // Types are Hardcoded in the Codebase
  missionType: varchar().notNull().default(missionTypes[0]!.id),
  ...timeStampts,
});

export const missionScheduleTable = snakeCase.table("mission_schedule", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  missionId: integer()
    .references(() => missionTable.id)
    .notNull(),
  scheduleNumber: varchar().unique().notNull(),
  name: varchar().notNull(),
  description: varchar().notNull().default(""),
  startDateTime: timestamp(),
  endDateTime: timestamp(),
  // aircraftId: integer().references(() => aircraftTable.id),
  areaId: integer().references(() => areaTable.id),
  // instructorId: integer().references(() => personnelTable.id),
  // pilotId: integer().references(() => personnelTable.id),
  status: missionStatusEnum().notNull().default("draft"),
  remarks: varchar(),
  ...timeStampts,
});

export const missionAssignmentGradingStatusEnum = pgEnum(
  "mission_assignment_grading_status",
  ["pending", "scored", "exempt"],
);

// Mission Assigned to whom and there stats
export const missionScheduleParticipantTable = snakeCase.table(
  "mission_schedule_participant",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity().notNull(),
    missionScheduleId: integer()
      .references(() => missionScheduleTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    personnelId: integer()
      .references(() => personnelTable.id)
      .notNull(),
    attendanceStatus: attendanceStatusEnum(),
    aircraftId: integer().references(() => aircraftTable.id),
    briefingTime: timestamp(),
    /** Time will Be Stored with in UTC*/
    aircraftTime: timestamp(),
    takeoffTime: timestamp(),
    landingTime: timestamp(),
    remarks: varchar(),

    // This Stores Overall Result of the Mission
    obtainedGradeId: integer().references(() => gradingScaleOptionTable.id),
    // this score can be any value
    obtainedScoreValue: numeric({
      precision: 10, // up to 9999999999.99
      scale: 2,
    }),
    obtainedScorePercentage: numeric({
      precision: 5, // up to 999.99
      scale: 2,
    }),
    // This is used to check if the assignment is scored or not
    scoredStatus: missionAssignmentGradingStatusEnum()
      .notNull()
      .default("pending"),
    result: missionScheduleStatusEnum(),
    order: integer(),
    ...timeStampts,
  },
  (table) => [
    uniqueIndex("unique_mission_schedule_id_personnel_id_idx").on(
      table.missionScheduleId,
      table.personnelId,
    ),
  ],
);

export const missionScheduleParticipantGradingTable = snakeCase.table(
  "mission_schedule_participant_grading",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    // misison Assignment own the table so we use cascade
    missionScheduleParticipantId: integer()
      .references(() => missionScheduleParticipantTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    gradingTemplateAttributeId: integer()
      .references(() => gradingTemplateAttributeTable.id)
      .notNull(),
    // Can be null if the attribute is not graded on a scale
    // Label of Score Value
    gradingScaleOptionId: integer().references(
      () => gradingScaleOptionTable.id,
    ),
    weightAtGrading: integer(), //// frozen copy of templateAttribute.weight
    // Final Numberic Score Value When Grading is Completed
    obtainedScoreValue: numeric({
      precision: 5, // up to 999.99
      scale: 2,
    }),
    status: missionAssignmentGradingStatusEnum().notNull().default("pending"),
    ...timeStampts,
  },
  (table) => [
    uniqueIndex(
      "unique_mission_schedule_participant_id_grading_template_attribute_id_idx",
    ).on(table.missionScheduleParticipantId, table.gradingTemplateAttributeId),
  ],
);

export const aircraftTable = snakeCase.table("aircraft", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar().notNull(),
  tailNumber: varchar().unique().notNull(),
  // Manufacturer's MSN — used for maintenance records, logbooks, parts tracking, distinct from tail number
  serialNumber: varchar(),
  aircraftType: varchar(),
  // Date When its bought/inducted into the squadron
  inductionDate: date(),
  remarks: varchar(),
  status: varchar(), // active, grounded, reserved, in_storage, retired
  ...timeStampts,
});

export const mediaTable = snakeCase.table(
  "media",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    path: varchar().notNull(),
    originalFileName: varchar().notNull(),
    status: mediaStatusEnum().notNull().default("draft"),
    mimeType: varchar().notNull(),
    size: integer().notNull(),
    statusUpdatedAt: timestamp().defaultNow().notNull(),
    ...timeStampts,
  },
  (table) => [
    index("media_status_created_idx").on(table.status, table.createdAt),
  ],
);

/** Masters Tables */
export const locationTable = snakeCase.table("location", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar().notNull(),
  code: varchar().notNull().unique(),
  address: varchar(),
  phone: varchar(),
  description: varchar(),
  ...timeStampts,
});

export const areaTable = snakeCase.table("area", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar().notNull(),
  code: varchar().notNull().unique(),
  address: varchar(),
  description: varchar(),
  ...timeStampts,
});

// OTHERS
export const sessionTable = snakeCase.table("session", {
  sid: varchar().primaryKey().notNull(),
  sess: jsonb().notNull(),
  expireAt: timestamp().notNull(),
  version: integer().notNull().default(1),
  ...timeStampts,
});

// export const documentTypeEnum = pgEnum("document_type", [
//   "personnel",
//   "mission",
//   "schedule",
//   "location",
//   "area",
// ]);

// export const documentSequence = snakeCase.table("document_sequence", {
//   id: integer().primaryKey().generatedAlwaysAsIdentity(),
//   documentype: documentTypeEnum().notNull(),
//   prefix: varchar().notNull(),
//   suffix: varchar().notNull(),
//   currentSequence: integer().notNull().default(0),
//   ...timeStampts,
// });

// export const roleTable = snakeCase.table("role", {
//   id: integer().primaryKey().generatedAlwaysAsIdentity(),
//   name: varchar().notNull(),
//   description: varchar(),
//   ...timeStampts,
// });

// export const rolePermissionTable = snakeCase.table("role_permission", {
//   id: integer().primaryKey().generatedAlwaysAsIdentity(),
//   roleId: integer().references(() => roleTable.id),
//   permission: varchar().notNull(),
//   ...timeStampts,
// });

// ---------------- Gradding --------------------//
export const gradingAttributeTable = snakeCase.table("grading_attribute", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar().notNull().unique(),
  notes: varchar(),
  ...timeStampts,
});

export const gradingScaleTable = snakeCase.table("grading_scale", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar().notNull(),
  notes: varchar(),
  ...timeStampts,
});

export const gradingScaleOptionTable = snakeCase.table(
  "grading_scale_option",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    gradingScaleId: integer()
      .references(() => gradingScaleTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    label: varchar().notNull(),
    point: numeric({
      precision: 5, // up to 999.99
      scale: 2,
    }).notNull(),
    lowerBound: numeric({
      precision: 5,
      scale: 2,
    }).notNull(),
    upperBound: numeric({
      precision: 5,
      scale: 2,
    }).notNull(),
    ...timeStampts,
  },
  (table) => [
    uniqueIndex("unique_grading_scale_id_label_idx").on(
      table.gradingScaleId,
      table.label,
    ),
  ],
);

export const gradingTemplateTable = snakeCase.table("grading_template", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar().notNull(),
  notes: varchar(),
  gradingScaleId: integer()
    .references(() => gradingScaleTable.id)
    .notNull(),
  ...timeStampts,
});

export const gradingTemplateAttributeTable = snakeCase.table(
  "grading_template_attribute",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    gradingTemplateId: integer()
      .references(() => gradingTemplateTable.id, {
        onDelete: "cascade",
      })
      .notNull(),
    attributeId: integer()
      .references(() => gradingAttributeTable.id)
      .notNull(),
    weight: integer().notNull(),
    sortOrder: integer().notNull().default(0),
    ...timeStampts,
  },
  (table) => [
    uniqueIndex("unique_template_id_attribute_id_idx").on(
      table.gradingTemplateId,
      table.attributeId,
    ),
  ],
);

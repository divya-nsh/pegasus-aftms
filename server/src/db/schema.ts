import { getMissionType, missionTypes } from "@repo/shared";
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

export const missionTable = snakeCase.table("mission", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar().notNull(),
  description: varchar(),
  aircraftId: integer().references(() => aircraftTable.id),
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
  scheduleNumber: varchar().unique(),
  name: varchar(),
  description: varchar(),
  startDateTime: timestamp(),
  endDateTime: timestamp(),
  aircraftId: integer().references(() => aircraftTable.id),
  areaId: integer().references(() => areaTable.id),
  instructorId: integer().references(() => personnelTable.id),
  pilotId: integer().references(() => personnelTable.id),
  status: missionStatusEnum().notNull().default("draft"),
  remarks: varchar(),
  ...timeStampts,
});

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "pending",
  "present",
  "absent",
  "excused",
]);

export const missionResultEnum = pgEnum("mission_result", [
  "pending",
  "passed",
  "failed",
]);

// Mission Assigned to whom and there stats
export const missionAssignmentTable = snakeCase.table("mission_assignment", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  scheduleId: integer().references(() => missionScheduleTable.id),
  personId: integer().references(() => personnelTable.id),
  attendanceStatus: attendanceStatusEnum().notNull().default("pending"),
  remarks: varchar(),
  score: integer(),
  result: missionResultEnum().notNull().default("pending"),
  ...timeStampts,
});

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

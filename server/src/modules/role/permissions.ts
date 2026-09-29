// const PermissionResources = {
//   LOCATION_CREATE: "location.create",
//   LOCATION_READ: "location.read",
//   LOCATION_UPDATE: "location.update",
//   LOCATION_DELETE: "location.delete",

//   AREA_CREATE: "area.create",
//   AREA_READ: "area.read",
//   AREA_UPDATE: "area.update",
//   AREA_DELETE: "area.delete",

//   AIRCRAFT_CREATE: "aircraft.create",
//   AIRCRAFT_READ: "aircraft.read",
//   AIRCRAFT_UPDATE: "aircraft.update",
//   AIRCRAFT_DELETE: "aircraft.delete",

//   EVENT_CREATE: "event.create",
//   EVENT_READ: "event.read",
//   EVENT_UPDATE: "event.update",
//   EVENT_DELETE: "event.delete",

//   USER_CREATE: "user.create",
//   USER_READ: "user.read",
//   USER_UPDATE: "user.update",
//   USER_DELETE: "user.delete",

//   PERSONNEL_CREATE: "personnel.create",
//   PERSONNEL_READ: "personnel.read",
//   PERSONNEL_UPDATE: "personnel.update",

//   ADMIN_CREATE: "admin.create",
//   ADMIN_READ: "admin.read",
//   ADMIN_UPDATE: "admin.update",
//   ADMIN_DELETE: "admin.delete",

//   ROLE_CREATE: "role.create",
//   ROLE_READ: "role.read",
//   ROLE_UPDATE: "role.update",
//   ROLE_DELETE: "role.delete",

//   GRADING_ATTRIBUTE_CREATE: "grading_attribute.create",
//   GRADING_ATTRIBUTE_READ: "grading_attribute.read",
//   GRADING_ATTRIBUTE_UPDATE: "grading_attribute.update",
//   GRADING_ATTRIBUTE_DELETE: "grading_attribute.delete",

//   GRADING_SCALE_CREATE: "grading_scale.create",
//   GRADING_SCALE_READ: "grading_scale.read",
//   GRADING_SCALE_UPDATE: "grading_scale.update",
//   GRADING_SCALE_DELETE: "grading_scale.delete",

//   GRADING_TEMPLATE_CREATE: "grading_template.create",
//   GRADING_TEMPLATE_READ: "grading_template.read",
//   GRADING_TEMPLATE_UPDATE: "grading_template.update",
//   GRADING_TEMPLATE_DELETE: "grading_template.delete",

//   EVENT_SCHEDULE_CREATE: "event_schedule.create",
//   EVENT_SCHEDULE_READ: "event_schedule.read",
//   EVENT_SCHEDULE_UPDATE: "event_schedule.update",
//   EVENT_SCHEDULE_DELETE: "event_schedule.delete",
// };

// permissions.ts

// Key and label for the actions
const ACTIONS = {
  create: "Create",
  read: "View",
  update: "Update",
  delete: "Delete",
} as const;

export type TPermissionActions = keyof typeof ACTIONS;

// Key and label for the resources
const RESOUCES = {
  location: "Location",
  area: "Area",
  aircraft: "Aircraft",
  event: "Event",
  eventSchedule: "Event Schedule",
  user: "User",
  personnel: "Personnel",
  gradingScale: "Grading Scale",
  gradingTemplate: "Grading Template",
  gradingAttribute: "Grading Attribute",
  //   admin: "Admin",
} as const;

export type TPermissionResouces = keyof typeof RESOUCES;

const CRUD_ACTIONS: TPermissionActions[] = [
  "create",
  "read",
  "update",
  "delete",
];

// Supported Permissions Combination
const PERMISSIONS_MAP = {
  personnel: CRUD_ACTIONS,
  eventSchedule: CRUD_ACTIONS,
  event: CRUD_ACTIONS,
  aircraft: CRUD_ACTIONS,
  location: CRUD_ACTIONS,
  area: CRUD_ACTIONS,
  user: CRUD_ACTIONS,
  gradingScale: CRUD_ACTIONS,
  gradingTemplate: CRUD_ACTIONS,
  gradingAttribute: CRUD_ACTIONS,
} satisfies Record<TPermissionResouces, TPermissionActions[]>;

const PERMISSIONS_ARRAY: string[] = [];

Object.entries(PERMISSIONS_MAP).forEach(([resource, actions]) => {
  actions.forEach((action) => {
    PERMISSIONS_ARRAY.push(`${resource}.${action}`);
  });
});

const PERMISSIONS_SET = new Set(PERMISSIONS_ARRAY);

export { PERMISSIONS_ARRAY, PERMISSIONS_MAP, PERMISSIONS_SET };

// List of permissions for the UI to display
const permissionsList: Array<{
  resource: string;
  label: string;
  actions: Array<{
    action: string;
    label: string;
    key: string;
  }>;
}> = [];

Object.entries(PERMISSIONS_MAP).forEach(([resource, actions]) => {
  permissionsList.push({
    resource,
    label: RESOUCES[resource as TPermissionResouces],
    actions: actions.map((action) => ({
      action,
      label: ACTIONS[action as TPermissionActions],
      key: `${resource}.${action}`,
    })),
  });
});

export type TPermissionKey =
  `${TPermissionResouces}.${TPermissionActions}` | "*";

export { permissionsList };

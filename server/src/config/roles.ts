import type { Role } from "#/types/role.js";

export const roles: Role[] = [
  {
    id: "admin",
    name: "Admin",
    isAdmin: true,
    permissions: [],
  },
  {
    id: "trainee",
    name: "Trainee",
    permissions: [
      {
        module: "personnel",
        actions: ["view"],
        scope: "assigned",
      },
    ],
  },
  {
    id: "instructor",
    name: "Instructor",
    isAdmin: true,
    permissions: [],
  },
];

export const DEFAULT_TRAINEE_ROLE = "trainee";
export const DEFAULT_INSTRUCTOR_ROLE = "instructor";
export const DEFAULT_ADMIN_ROLE = "admin";

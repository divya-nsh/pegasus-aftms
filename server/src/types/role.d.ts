export type ModuleAction = "view" | "edit" | "create" | "delete";
export type Scope = "own" | "all" | "assigned";

export type RoleModule =
  | "user"
  | "aircraft"
  | "area"
  | "location"
  | "personnel"
  | "schedule"
  | "mission"
  | "trainee_dashboard";

export type Permission = {
  module: RoleModule;
  actions: ModuleAction[];
  scope: Scope | null;
};

export type Role = {
  //  What store in user role field in db
  id: string;
  // Display name
  name: string;
  //IF Admin Means allow everthing
  isAdmin?: boolean;
  permissions: Permission[];
};

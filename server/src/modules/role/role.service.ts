import { roles } from "#/config/roles.js";
import type { Module, ModuleAction } from "#/types/role.js";

class RoleService {
  constructor() {}

  getAll() {
    return roles;
  }

  getById(id: string) {
    return roles.find((role) => role.id === id);
  }

  /** Return The scope of the action if has permission, otherwise return false */
  canDo(roleId: string, module: Module, action: ModuleAction) {
    const role = this.getById(roleId);
    if (!role) throw new Error("Role not found");

    const scope = role.permissions.find(
      (permission) =>
        permission.module === module && permission.actions.includes(action),
    );
    if (!scope) return false;
    return scope;
  }
}

const roleService = new RoleService();

export default roleService;

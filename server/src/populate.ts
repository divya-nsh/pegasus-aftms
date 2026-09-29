import roleService from "./modules/role/role.service.js";
import { ensureDefaultAdmin } from "./modules/user/seed-admin.js";

export async function populateData() {
  await roleService.populate();
  await ensureDefaultAdmin();
}

export default populateData;

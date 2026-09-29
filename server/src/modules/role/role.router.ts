import { protectedProcedure, router } from "#/trpc.js";
import { permissionsList } from "./permissions.js";
import roleService from "./role.service.js";
import { z } from "zod";

const createRoleSchema = z.object({
  name: z.string(),
  permissions: z.array(z.string()),
});

const roleRouter = router({
  getPermissions: protectedProcedure.query(() => permissionsList),
  getAll: protectedProcedure.query(() => roleService.getAll()),
  create: protectedProcedure
    .input(createRoleSchema)
    .mutation(({ input }) => roleService.create(input)),
  getById: protectedProcedure
    .input(z.number())
    .query(({ input }) => roleService.getById(input)),
  update: protectedProcedure
    .input(createRoleSchema.extend({ id: z.number() }))
    .mutation(({ input }) => roleService.update(input.id, input)),
  delete: protectedProcedure
    .input(z.number())
    .mutation(({ input }) => roleService.delete(input)),
});

export default roleRouter;

import { publicProcedure, router } from "#/trpc.js";
import roleService from "./role.service.js";
import { z } from "zod";

const roleRouter = router({
  getAll: publicProcedure.query(() => roleService.getAll()),
  getById: publicProcedure
    .input(z.string())
    .query(({ input }) => roleService.getById(input)),
  getOptions: publicProcedure.query(() =>
    roleService.getAll().map((role) => ({ label: role.name, value: role.id })),
  ),
});

export default roleRouter;

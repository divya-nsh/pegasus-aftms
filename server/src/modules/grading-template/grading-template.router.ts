import { protectedProcedure, router } from "#/trpc.js";
import gradingTemplateService from "./grading-template.service.js";
import {
  createSchema,
  idSchema,
  isNameExistsSchema,
  updateSchema,
} from "./grading-template.schema.js";
import { z } from "zod";

const gradingTemplateRouter = router({
  getAll: protectedProcedure.query(() => gradingTemplateService.getAll()),

  getById: protectedProcedure
    .input(z.number())
    .query(({ input }) => gradingTemplateService.getById(input)),

  isNameExists: protectedProcedure
    .input(isNameExistsSchema)
    .query(({ input }) =>
      gradingTemplateService.isNameExists(input.name, input.excludeId),
    ),

  create: protectedProcedure
    .input(createSchema)
    .mutation(({ input }) => gradingTemplateService.create(input)),

  update: protectedProcedure.input(updateSchema).mutation(({ input }) => {
    const { toEditId, ...data } = input;
    return gradingTemplateService.update(toEditId, data);
  }),

  delete: protectedProcedure
    .input(idSchema)
    .mutation(({ input }) => gradingTemplateService.delete(input.id)),
});

export default gradingTemplateRouter;

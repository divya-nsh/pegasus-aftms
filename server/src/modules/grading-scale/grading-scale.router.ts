import { protectedProcedure, router } from "#/trpc.js";
import gradingScaleService from "./grading-scale.service.js";
import {
  createSchema,
  idSchema,
  isNameExistsSchema,
  updateSchema,
} from "./grading-scale.schema.js";

const gradingScaleRouter = router({
  getAll: protectedProcedure.query(() => gradingScaleService.getAll()),

  getById: protectedProcedure
    .input(idSchema)
    .query(({ input }) => gradingScaleService.getById(input.id)),

  isNameExists: protectedProcedure
    .input(isNameExistsSchema)
    .query(({ input }) =>
      gradingScaleService.isNameExists(input.name, input.excludeId),
    ),

  create: protectedProcedure
    .input(createSchema)
    .mutation(({ input }) => gradingScaleService.create(input)),

  update: protectedProcedure.input(updateSchema).mutation(({ input }) => {
    const { toEditId, ...data } = input;
    return gradingScaleService.update(toEditId, data);
  }),

  delete: protectedProcedure
    .input(idSchema)
    .mutation(({ input }) => gradingScaleService.delete(input.id)),
});

export default gradingScaleRouter;

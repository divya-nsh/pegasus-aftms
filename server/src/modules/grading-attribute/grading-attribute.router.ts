import { protectedProcedure, router } from "#/trpc.js";
import gradingAttributeService from "./grading-attribute.service.js";
import {
  createSchema,
  idSchema,
  isNameExistsSchema,
  updateSchema,
} from "./grading-attribute.schema.js";

const gradingAttributeRouter = router({
  getAll: protectedProcedure.query(() => gradingAttributeService.getAll()),

  /** Helper query to get options for combobox */
  getComboboxOptions: protectedProcedure.query(async () => {
    const { items } = await gradingAttributeService.getAll();
    return items.map((attribute) => ({
      label: attribute.name,
      value: attribute.id,
    }));
  }),

  getById: protectedProcedure
    .input(idSchema)
    .query(({ input }) => gradingAttributeService.getById(input.id)),

  isNameExists: protectedProcedure
    .input(isNameExistsSchema)
    .query(({ input }) =>
      gradingAttributeService.isNameExists(input.name, input.excludeId),
    ),

  create: protectedProcedure
    .input(createSchema)
    .mutation(({ input }) => gradingAttributeService.create(input)),

  update: protectedProcedure.input(updateSchema).mutation(({ input }) => {
    const { toEditId, ...data } = input;
    return gradingAttributeService.update(toEditId, data);
  }),

  delete: protectedProcedure
    .input(idSchema)
    .mutation(({ input }) => gradingAttributeService.delete(input.id)),
});

export default gradingAttributeRouter;

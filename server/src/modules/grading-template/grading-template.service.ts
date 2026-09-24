import db from "#/db/db.js";
import {
  gradingTemplateAttributeTable,
  gradingTemplateTable,
} from "#/db/schema.js";
import { diffIds } from "#/lib/diffIds.js";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray, ne, sql } from "drizzle-orm";

type TCreateGradingTemplate = {
  name: string;
  notes: string;
  gradingScaleId: number;
  attributes: {
    id?: number | null;
    attributeId: number;
    weight: number;
  }[];
};

const templateWith = {
  gradingScale: true,
  gradingTemplateAttributes: {
    with: { gradingAttribute: true },
    orderBy: { sortOrder: "asc" },
  },
} as const;

class GradingTemplateService {
  async getAll() {
    const items = await db.query.gradingTemplateTable.findMany({
      with: templateWith,
      orderBy: { id: "desc" },
    });

    return { items, totalCount: items.length };
  }

  async getById(id: number) {
    const template = await db.query.gradingTemplateTable.findFirst({
      with: {
        gradingScale: {
          with: {
            options: true,
          },
        },
        gradingTemplateAttributes: {
          with: {
            gradingAttribute: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      where: { id },
    });

    if (!template) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Grading template not found",
      });
    }

    return template;
  }

  async isNameExists(name: string, excludeId?: number) {
    const [template] = await db
      .select({ id: gradingTemplateTable.id })
      .from(gradingTemplateTable)
      .where(
        and(
          sql`lower(${gradingTemplateTable.name}) = ${name.toLowerCase()}`,
          excludeId ? ne(gradingTemplateTable.id, excludeId) : undefined,
        ),
      )
      .limit(1);

    return template?.id ?? false;
  }

  async create(values: TCreateGradingTemplate) {
    const nameExists = await this.isNameExists(values.name);
    if (nameExists) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Grading template name already exists",
      });
    }

    return db.transaction(async (tx) => {
      const [template] = await tx
        .insert(gradingTemplateTable)
        .values({
          name: values.name,
          notes: values.notes ?? null,
          gradingScaleId: values.gradingScaleId,
        })
        .returning({ id: gradingTemplateTable.id });

      await tx.insert(gradingTemplateAttributeTable).values(
        values.attributes.map((attr, index) => ({
          gradingTemplateId: template!.id,
          attributeId: attr.attributeId,
          weight: attr.weight,
          sortOrder: index,
        })),
      );

      return template!.id;
    });
  }

  async update(id: number, values: TCreateGradingTemplate) {
    const nameExists = await this.isNameExists(values.name, id);
    if (nameExists) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Grading template name already exists",
      });
    }

    return db.transaction(async (tx) => {
      const template = await tx
        .update(gradingTemplateTable)
        .set({
          name: values.name,
          notes: values.notes ?? null,
          gradingScaleId: values.gradingScaleId,
        })
        .where(eq(gradingTemplateTable.id, id))
        .returning({ id: gradingTemplateTable.id });

      if (template.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grading template not found",
        });
      }

      const existingAttributesIds = await db
        .select({ id: gradingTemplateAttributeTable.id })
        .from(gradingTemplateAttributeTable)
        .where(eq(gradingTemplateAttributeTable.gradingTemplateId, id));

      const { toInsert, toUpdate, toDelete } = diffIds(
        values.attributes.map((v, i) => ({ ...v, sortOrder: i })),
        existingAttributesIds.map((attr) => attr.id),
      );

      if (toDelete.length > 0) {
        await tx
          .delete(gradingTemplateAttributeTable)
          .where(inArray(gradingTemplateAttributeTable.id, toDelete));
      }

      for (const updateItem of toUpdate) {
        if (!updateItem.id) continue;
        await tx
          .update(gradingTemplateAttributeTable)
          .set({
            attributeId: updateItem.attributeId,
            weight: updateItem.weight,
            sortOrder: updateItem.sortOrder,
          })
          .where(
            and(
              eq(gradingTemplateAttributeTable.gradingTemplateId, id),
              eq(gradingTemplateAttributeTable.id, updateItem.id),
            ),
          );
      }

      if (toInsert.length > 0) {
        await tx.insert(gradingTemplateAttributeTable).values(
          toInsert.map((attr) => ({
            gradingTemplateId: id,
            attributeId: attr.attributeId,
            weight: attr.weight,
            sortOrder: attr.sortOrder,
          })),
        );
      }

      return template;
    });
  }

  async delete(id: number) {
    const template = await db
      .delete(gradingTemplateTable)
      .where(eq(gradingTemplateTable.id, id))
      .returning({ id: gradingTemplateTable.id });

    if (template.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Grading template not found",
      });
    }

    return template;
  }
}

const gradingTemplateService = new GradingTemplateService();

export default gradingTemplateService;

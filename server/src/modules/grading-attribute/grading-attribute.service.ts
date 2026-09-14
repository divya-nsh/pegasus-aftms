import db from "#/db/db.js";
import { gradingAttributeTable } from "#/db/schema.js";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, ne, sql } from "drizzle-orm";

type TCreateGradingAttribute = {
  name: string;
  notes: string;
};

class GradingAttributeService {
  async getAll() {
    const items = await db
      .select()
      .from(gradingAttributeTable)
      .orderBy(desc(gradingAttributeTable.id));

    return {
      items,
      totalCount: items.length,
    };
  }

  async getById(id: number) {
    const [attribute] = await db
      .select()
      .from(gradingAttributeTable)
      .where(eq(gradingAttributeTable.id, id))
      .limit(1);

    if (!attribute) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Grading attribute not found",
      });
    }

    return attribute;
  }

  async isNameExists(name: string, excludeId?: number) {
    const [attribute] = await db
      .select({ id: gradingAttributeTable.id })
      .from(gradingAttributeTable)
      .where(
        and(
          sql`lower(${gradingAttributeTable.name}) = ${name.toLowerCase()}`,
          excludeId ? ne(gradingAttributeTable.id, excludeId) : undefined,
        ),
      )
      .limit(1);

    return attribute?.id ?? false;
  }

  async create(values: TCreateGradingAttribute) {
    const nameExists = await this.isNameExists(values.name);
    if (nameExists) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Grading attribute name already exists",
      });
    }

    const [attribute] = await db
      .insert(gradingAttributeTable)
      .values({
        name: values.name,
        notes: values.notes ?? null,
      })
      .returning({ id: gradingAttributeTable.id });

    return attribute!.id;
  }

  async update(id: number, values: TCreateGradingAttribute) {
    const nameExists = await this.isNameExists(values.name, id);
    if (nameExists) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Grading attribute name already exists",
      });
    }

    const attribute = await db
      .update(gradingAttributeTable)
      .set({
        name: values.name,
        notes: values.notes ?? null,
      })
      .where(eq(gradingAttributeTable.id, id))
      .returning({ id: gradingAttributeTable.id });

    if (attribute.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Grading attribute not found",
      });
    }

    return attribute;
  }

  async delete(id: number) {
    const attribute = await db
      .delete(gradingAttributeTable)
      .where(eq(gradingAttributeTable.id, id))
      .returning({ id: gradingAttributeTable.id });

    if (attribute.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Grading attribute not found",
      });
    }

    return attribute;
  }
}

const gradingAttributeService = new GradingAttributeService();

export default gradingAttributeService;

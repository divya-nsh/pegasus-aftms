import db, { type DBTransaction } from "#/db/db.js";
import { gradingScaleOptionTable, gradingScaleTable } from "#/db/schema.js";
import { diffIds } from "#/lib/diffIds.js";
import { TRPCError } from "@trpc/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { inArray } from "drizzle-orm/pg-core/expressions";

type TGradingScaleOption = {
  id: number | null;
  label: string;
  point: number;
  lowerBound: number;
  upperBound: number;
};

type TCreateGradingScale = {
  name: string;
  notes: string;
  options: TGradingScaleOption[];
};

class GradingScaleService {
  async getAll() {
    const items = await db.query.gradingScaleTable.findMany({
      with: {
        options: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return {
      items,
      totalCount: items.length,
    };
  }

  async getById(id: number) {
    const scale = await db.query.gradingScaleTable.findFirst({
      with: {
        options: true,
      },
      where: { id },
    });

    if (!scale) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Grading scale not found",
      });
    }

    return scale;
  }

  async isNameExists(name: string, excludeId?: number) {
    const [scale] = await db
      .select({ id: gradingScaleTable.id })
      .from(gradingScaleTable)
      .where(
        and(
          sql`lower(${gradingScaleTable.name}) = ${name.toLowerCase()}`,
          excludeId ? ne(gradingScaleTable.id, excludeId) : undefined,
        ),
      )
      .limit(1);

    return scale?.id ?? false;
  }

  async create(values: TCreateGradingScale) {
    validateOptions(values.options);
    const nameExists = await this.isNameExists(values.name);
    if (nameExists) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Grading scale name already exists",
      });
    }

    return db.transaction(async (tx) => {
      const [scale] = await tx
        .insert(gradingScaleTable)
        .values({
          name: values.name,
          notes: values.notes ?? null,
        })
        .returning({ id: gradingScaleTable.id });

      await tx.insert(gradingScaleOptionTable).values(
        values.options.map((option) => ({
          gradingScaleId: scale!.id,
          label: option.label,
          point: String(option.point),
          lowerBound: String(option.lowerBound),
          upperBound: String(option.upperBound),
        })),
      );

      return scale!.id;
    });
  }

  async update(id: number, values: TCreateGradingScale) {
    validateOptions(values.options);
    const nameExists = await this.isNameExists(values.name, id);
    if (nameExists) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Grading scale name already exists",
      });
    }

    return db.transaction(async (tx) => {
      const scale = await tx
        .update(gradingScaleTable)
        .set({
          name: values.name,
          notes: values.notes ?? null,
        })
        .where(eq(gradingScaleTable.id, id))
        .returning({ id: gradingScaleTable.id });

      if (scale.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Grading scale not found",
        });
      }
      const existingOptionsIds = await this.getOptionsIds(tx, id);

      const { toInsert, toUpdate, toDelete } = diffIds(
        values.options,
        existingOptionsIds,
      );

      console.log(toDelete, toUpdate, toInsert);

      if (toDelete.length > 0) {
        const deleted = await tx
          .delete(gradingScaleOptionTable)
          .where(inArray(gradingScaleOptionTable.id, toDelete));
        console.log(deleted);
      }

      for (const updateItem of toUpdate) {
        await tx
          .update(gradingScaleOptionTable)
          .set({
            label: updateItem.label,
            point: String(updateItem.point),
            lowerBound: String(updateItem.lowerBound),
            upperBound: String(updateItem.upperBound),
          })
          .where(eq(gradingScaleOptionTable.id, id));
      }

      if (toInsert.length > 0) {
        await tx.insert(gradingScaleOptionTable).values(
          toInsert.map((option) => ({
            gradingScaleId: id,
            label: option.label,
            point: String(option.point),
            lowerBound: String(option.lowerBound),
            upperBound: String(option.upperBound),
          })),
        );
      }

      return scale;
    });
  }

  async delete(id: number) {
    const scale = await db
      .delete(gradingScaleTable)
      .where(eq(gradingScaleTable.id, id))
      .returning({ id: gradingScaleTable.id });

    if (scale.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Grading scale not found",
      });
    }

    return scale;
  }

  async getOptionsIds(tx: DBTransaction, gradingScaleId: number) {
    const options = await tx.query.gradingScaleOptionTable.findMany({
      columns: {
        id: true,
      },
      where: { gradingScaleId },
    });
    return options.map((option) => option.id);
  }
}

const gradingScaleService = new GradingScaleService();

export default gradingScaleService;

function validateOptions(options: TGradingScaleOption[]) {
  if (options.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No options provided",
    });
  }

  const sorted = [...options].sort((a, b) => a.lowerBound - b.lowerBound);

  if (sorted[0]!.lowerBound !== 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Range must start at 0",
    });
  }

  const nameSet = new Set<string>();

  options.forEach((option) => {
    if (option.lowerBound < 0 || option.upperBound > 100) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Range must be between 0 and 100",
      });
    }
    if (nameSet.has(option.label.toLowerCase())) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Duplicate label "${option.label.toLowerCase()}" found at index ${options.indexOf(option)}`,
      });
    }
    nameSet.add(option.label.toLowerCase());
    if (option.point < option.lowerBound || option.point > option.upperBound) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Point must be between lower bound and upper bound at index " +
          options.indexOf(option),
      });
    }
    if (option.lowerBound > option.upperBound) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Lower bound must be less than or equal to upper bound at index " +
          options.indexOf(option),
      });
    }
  });

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i]!.upperBound + 1 !== sorted[i + 1]!.lowerBound) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Ranges have a gap or overlap missing range from ${sorted[i]!.upperBound + 1} to ${sorted[i + 1]!.lowerBound - 1}`,
      });
    }
  }

  if (sorted.at(-1)!.upperBound !== 100) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Range must end at 100",
    });
  }
}

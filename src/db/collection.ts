import { and, or, eq, inArray, isNull, asc, desc } from "drizzle-orm";
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import { db } from "@/db";
import { SORT_ASC, SORT_DESC } from "@/lib/constants";

// Generic query filter type
type QueryFilter<T> = {
  [K in keyof T]?: T[K] | { $in: T[K][] };
} & {
  $and?: { [K in keyof T]?: T[K] | { $in: T[K][] } };
  $or?: { [K in keyof T]?: T[K] | { $in: T[K][] } };
};

// Query options type
type QueryOptions<T> = {
  sort?: { [K in keyof T]?: typeof SORT_ASC | typeof SORT_DESC };
  limit?: number;
  offset?: number;
};

// Update result type
type UpdateResult = {
  success: boolean;
  count: number;
};

// Custom schemas option type
interface Schemas {
  insert?: z.ZodSchema<any>;
  update?: z.ZodSchema<any>;
}

/**
 * Collection-like wrapper providing MongoDB-style query interface for Drizzle tables
 *
 * Support common database operations to reduce the number of boilerplate queries that must be written.
 */
export class TableCollection<
  TRecord extends Record<string, any>,
  TNew extends Partial<TRecord>,
  TUpdate extends Partial<TRecord> = Partial<TRecord>,
> {
  private querySchema: z.ZodSchema<any>;
  private insertSchema: z.ZodSchema<any>;
  private updateSchema: z.ZodSchema<any>;

  constructor(
    private table: any,
    schemas?: Schemas,
  ) {
    const recordSchema = createSelectSchema(this.table);

    this.querySchema = createQueryFilterSchema(recordSchema);
    this.insertSchema = schemas?.insert ?? createInsertSchema(this.table);
    this.updateSchema = schemas?.update ?? createUpdateSchema(this.table);
  }

  /**
   */
  async find(
    filter: QueryFilter<TRecord>,
    options?: QueryOptions<TRecord>,
  ): Promise<TRecord[]> {
    const safe = this.querySchema.parse(filter);
    const whereClause = buildWhere(this.table, safe);

    let query = db.select().from(this.table) as any;

    if (whereClause) {
      query = query.where(whereClause);
    }

    if (options?.sort) {
      const orderBy = buildOrderBy(this.table, options.sort);
      if (orderBy.length > 0) {
        query = query.orderBy(...orderBy);
      }
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const result = await query;
    return result as TRecord[];
  }

  /**
   */
  async findOne(
    filter: QueryFilter<TRecord>,
    options?: QueryOptions<TRecord>,
  ): Promise<TRecord | null> {
    const findOptions = { ...options, limit: 1 };
    const [results] = await this.find(filter, findOptions);
    return results ?? null;
  }

  /**
   */
  async insert(record: TNew): Promise<TRecord> {
    const safe = this.insertSchema.parse(record);
    const result = await db.insert(this.table).values(safe).returning();
    const [inserted] = result as TRecord[];
    return inserted;
  }

  /**
   */
  async insertMany(records: TNew[]): Promise<TRecord[]> {
    const safe = records.map((record) => this.insertSchema.parse(record));
    const result = await db.insert(this.table).values(safe).returning();
    return result as TRecord[];
  }

  /**
   */
  async update(
    filter: QueryFilter<TRecord>,
    update: TUpdate,
  ): Promise<TRecord | null> {
    const filt = this.querySchema.parse(filter);
    const safe = this.updateSchema.parse(update);
    const whereClause = buildWhere(this.table, filt);
    if (!whereClause) throw new Error("Invalid filter");

    const [updated] = await db
      .update(this.table)
      .set(safe)
      .where(whereClause)
      .returning();

    return updated ?? null;
  }

  /**
   */
  async updateMany(
    filter: QueryFilter<TRecord>,
    update: TUpdate,
  ): Promise<UpdateResult> {
    const filt = this.querySchema.parse(filter);
    const safe = this.updateSchema.parse(update);
    const whereClause = buildWhere(this.table, filt);
    if (!whereClause) throw new Error("Invalid filter");

    const result = await db.update(this.table).set(safe).where(whereClause);

    return {
      success: true,
      count: result.rowCount ?? 0,
    };
  }

  /**
   * @approved_by: dremnik - 7.18.25
   */
  async delete(filter: QueryFilter<TRecord>): Promise<TRecord[]> {
    const safe = this.querySchema.parse(filter);
    const whereClause = buildWhere(this.table, safe);
    if (!whereClause) throw new Error("Invalid filter");

    const result = await db.delete(this.table).where(whereClause).returning();
    return result as TRecord[];
  }
}

/**
 * Converts query filter to Drizzle where clause
 */
function buildWhere<T>(table: any, filter: QueryFilter<T>): any {
  const conditions: any[] = [];

  // Helper function to build condition for a field value
  function buildFieldCondition(field: string, value: any) {
    if (value && typeof value === "object" && "$in" in value) {
      return inArray(table[field], value.$in);
    }
    if (value === null) {
      return isNull(table[field]);
    }
    return eq(table[field], value);
  }

  // Handle regular fields (AND behavior by default)
  const regularFields = Object.entries(filter)
    .filter(([key, value]) => !key.startsWith("$") && value !== undefined)
    .map(([field, value]) => buildFieldCondition(field, value));

  if (regularFields.length > 0) {
    conditions.push(and(...regularFields));
  }

  // Handle $and operator
  if (filter.$and) {
    const andConditions = Object.entries(filter.$and)
      .filter(([_, value]) => value !== undefined)
      .map(([field, value]) => buildFieldCondition(field, value));

    if (andConditions.length > 0) {
      conditions.push(and(...andConditions));
    }
  }

  // Handle $or operator
  if (filter.$or) {
    const orConditions = Object.entries(filter.$or)
      .filter(([_, value]) => value !== undefined)
      .map(([field, value]) => buildFieldCondition(field, value));

    if (orConditions.length > 0) {
      conditions.push(or(...orConditions));
    }
  }

  // Combine all conditions with AND
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

/**
 * Converts sort options to Drizzle orderBy clauses
 */
function buildOrderBy<T>(
  table: any,
  sort: { [K in keyof T]?: typeof SORT_ASC | typeof SORT_DESC },
): any[] {
  return Object.entries(sort)
    .filter(
      ([_, direction]) => direction === SORT_ASC || direction === SORT_DESC,
    )
    .map(([field, direction]) => {
      return direction === SORT_ASC ? asc(table[field]) : desc(table[field]);
    });
}

/**
 * Creates a Zod schema for query filters based on a record type
 */
function createQueryFilterSchema<T extends Record<string, any>>(
  fieldSchema: z.ZodObject<any>,
) {
  // Create schemas that support both direct values and $in operator
  const fieldWithInSchema = Object.fromEntries(
    Object.entries(fieldSchema.shape).map(([key, schema]) => [
      key,
      z
        .union([
          schema as z.ZodTypeAny,
          z.object({ $in: z.array(schema as z.ZodTypeAny) }),
        ])
        .optional(),
    ]),
  );

  return z
    .object({
      // Operators
      $and: z.object(fieldWithInSchema).partial().optional(),
      $or: z.object(fieldWithInSchema).partial().optional(),
    })
    .extend(fieldWithInSchema)
    .partial()
    .strict();
}

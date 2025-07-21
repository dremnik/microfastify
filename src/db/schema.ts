import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

/**
 * Users table schema
 */
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserRecord = InferSelectModel<typeof usersTable>;
export type NewUserRecord = InferInsertModel<typeof usersTable>;

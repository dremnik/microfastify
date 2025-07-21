import { TableCollection } from "./collection";
import { usersTable, NewUserRecord, UserRecord } from "./schema";

// Users
export const usersCollection = new TableCollection<UserRecord, NewUserRecord>(
  usersTable,
);

import { z } from "zod";

export const userSchemas = {
  create: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    age: z.number().min(1, "Age must be positive"),
  }),

  update: z.object({
    name: z.string().min(1, "Name is required").optional(),
    email: z.string().email("Invalid email format").optional(),
    age: z.number().min(1, "Age must be positive").optional(),
  }),

  params: z.object({
    id: z.coerce.number().int().positive("Invalid user ID"),
  }),

  query: z.object({
    limit: z.coerce.number().min(1).max(100).default(10),
    offset: z.coerce.number().min(0).default(0),
    search: z.string().optional(),
  }),
};

/* Request types */
export type UserCreateBody = z.infer<typeof userSchemas.create>;
export type UserUpdateBody = z.infer<typeof userSchemas.update>;
export type UserParams = z.infer<typeof userSchemas.params>;
export type UserQuery = z.infer<typeof userSchemas.query>;

/* Response types */
export interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsersListResponse {
  users: User[];
  total: number;
  limit: number;
  offset: number;
}

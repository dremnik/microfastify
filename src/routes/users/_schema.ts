import { z } from "zod";

export const userSchemas = {
  create: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["user", "admin"]).default("user"),
  }),

  update: z.object({
    name: z.string().min(1, "Name is required").optional(),
    email: z.string().email("Invalid email format").optional(),
    role: z.enum(["user", "admin"]).optional(),
  }),

  params: z.object({
    id: z.string().uuid("Invalid user ID format"),
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
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface UsersListResponse {
  users: User[];
  total: number;
  limit: number;
  offset: number;
}

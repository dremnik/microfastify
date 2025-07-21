import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import { Router } from "@/router";
import { NotFoundError } from "@/error";
import {
  userSchemas,
  UserQuery,
  User,
  UsersListResponse,
  UserParams,
  UserCreateBody,
} from "./_schema";

/* Users */
const users: FastifyPluginAsync = async (fastify) => {
  const router = new Router(fastify);
  // - /api/users -
  router.get("/", userSchemas.query, listUsers);
  router.get("/:id", userSchemas.params, getUser);
  router.post("/", userSchemas.create, createUser);
};

export default users;

/**
 * @handler: GET /api/users
 *
 * Returns a list of users based on query parameters
 */
async function listUsers(
  request: FastifyRequest,
  reply: FastifyReply,
  query: UserQuery,
): Promise<UsersListResponse> {
  const { limit, offset, search } = query;

  const response: UsersListResponse = {
    users: [],
    total: 0,
    limit,
    offset,
  };

  return response;
}

/**
 * @handler: GET /api/users/:id
 *
 * Returns the user with the specified id
 */
export async function getUser(
  request: FastifyRequest,
  reply: FastifyReply,
  params: UserParams,
): Promise<User | null> {
  const { id } = params;

  // Example: throw error if user not found
  if (id === "not-found") {
    throw new NotFoundError("User not found");
  }

  const user: User = {
    id,
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return user;
}

/**
 * @handler: POST /api/users
 *
 * Creates a new user
 */
export async function createUser(
  request: FastifyRequest,
  reply: FastifyReply,
  body: UserCreateBody,
) {
  const { name, email, role } = body;

  const user: User = {
    id: crypto.randomUUID(),
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return user;
}

import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { count } from "drizzle-orm";

/* db */
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { usersCollection } from "@/db/collections";

import { Router } from "@/api/router";
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
  const { limit, offset } = query;

  const users = await usersCollection.find({}, { limit, offset });

  // For total count, we still need a direct query
  const [{ total }] = await db.select({ total: count() }).from(usersTable);

  const response: UsersListResponse = {
    users,
    total: Number(total),
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

  const user = await usersCollection.findOne({ id }, { limit: 1 });

  if (!user) {
    throw new NotFoundError();
  }

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
  const { name, email, age } = body;

  const user = await usersCollection.insert({ name, email, age });

  reply.status(201);
  return user;
}

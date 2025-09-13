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

/**
 * ROUTES :: /users
 */
const ROUTES: FastifyPluginAsync = async (fastify) => {
  const router = new Router(fastify);
  router.get("/", { querystring: userSchemas.query }, listUsers);
  router.get("/:id", { params: userSchemas.params }, getUser);
  router.post("/", { body: userSchemas.create }, createUser);
};

export default ROUTES;

/**
 * @handler: GET /v1/users
 *
 * Returns a list of users based on query parameters
 */
async function listUsers(
  request: FastifyRequest<{ Querystring: UserQuery }>,
  reply: FastifyReply,
): Promise<UsersListResponse> {
  const { limit, offset } = request.query;

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
 * @handler: GET /v1/users/:id
 *
 * Returns the user with the specified id
 */
export async function getUser(
  request: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply,
): Promise<User | null> {
  const { id } = request.params;

  const user = await usersCollection.findOne({ id }, { limit: 1 });

  if (!user) {
    throw new NotFoundError();
  }

  return user;
}

/**
 * @handler: POST /v1/users
 *
 * Creates a new user
 */
export async function createUser(
  request: FastifyRequest<{ Body: UserCreateBody }>,
  reply: FastifyReply,
) {
  const { name, email, age } = request.body;

  const user = await usersCollection.insert({ name, email, age });

  reply.status(201);
  return user;
}

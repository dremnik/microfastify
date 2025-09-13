import fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  FastifyServerOptions,
} from "fastify";
import helmet from "@fastify/helmet";
import auth from "@fastify/auth";
import rateLimit from "@fastify/rate-limit";
import bearerAuthPlugin from "@fastify/bearer-auth";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { ZodError } from "zod";

import users from "@/api/users";
import { logger } from "./logger";
import { AUTH_KEYS, RATE_LIMIT_RPM } from "@/lib/constants";
import { APIError, InternalServerError, ValidationError } from "./error";
import database from "@/db";

/**
 * Main app builder.
 *
 * Registers routes, error handler, plugins, etc.
 */
export async function build(
  opts: FastifyServerOptions = {},
): Promise<FastifyInstance> {
  const app = fastify({
    logger,
    ...opts,
  });

  // Database
  await app.register(database);

  // Auth
  app.register(auth);
  // Bearer auth - API key
  app.register(bearerAuthPlugin, {
    addHook: false,
    keys: AUTH_KEYS,
    verifyErrorLogLevel: "debug",
  });

  app.register(helmet);
  app.register(rateLimit, { max: RATE_LIMIT_RPM, timeWindow: "1 minute" });

  // Schema validation
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register hooks
  app.addHook("onRequest", async (request, reply) => {
    request.log.info({ url: request.url }, "incoming request");
  });

  // Global error handler
  app.setErrorHandler(handleErrors);

  // Register routes
  await app.register(
    async (app) => {
      await app.register(users, { prefix: "/users" });
    },
    { prefix: "/v1" },
  );

  // Health check (outside of /api prefix)
  app.get("/health", async (request, reply) => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  return app;
}

/**
 * Convert errors to a standard structured response
 */
function handleErrors(
  error: any,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  let err: APIError = new InternalServerError("An unexpected error occurred");

  // Handle API errors with structured response
  if (error instanceof APIError) {
    err = error;
  }

  // Fastify | Zod validation errors
  if (
    error.validation ||
    error.validationContext ||
    error instanceof ZodError
  ) {
    err = new ValidationError("Invalid request data");
  }

  request.log.error({ err: error }, "request error");

  return reply.status(err.statusCode).send(err.json());
}

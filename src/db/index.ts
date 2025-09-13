import { drizzle } from "drizzle-orm/node-postgres";
import postgres from "@fastify/postgres";
import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";

import * as schema from "./schema";

let db: ReturnType<typeof drizzle>;

/**
 * Database plugin that integrates Drizzle ORM with @fastify/postgres
 */
async function database(fastify: FastifyInstance) {
  await fastify.register(postgres, {
    connectionString: process.env.DATABASE_URL!,
  });

  // Create Drizzle instance using the postgres pool and export it
  db = drizzle(fastify.pg.pool, { schema });
}

export { db };

export default fp(database, {
  name: "database",
});

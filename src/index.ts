import { build } from "./app";

const app = await build();

const port = parseInt(process.env.PORT || "8080", 10);
const host = process.env.HOST || "0.0.0.0";

/**
 * Gracefully shutdown the application
 */
async function closeGracefully(signal: string) {
  app.log.info({ signal }, "Received signal to terminate");

  await app.close();
  // Add any other cleanup here (database connections, etc.)

  process.exit(0);
}

// Handle termination signals
process.once("SIGINT", () => closeGracefully("SIGINT"));
process.once("SIGTERM", () => closeGracefully("SIGTERM"));

try {
  await app.listen({ port, host });
  app.log.info(`Server listening on ${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

import pino from "pino";
import { join } from "path";

// Create logger configuration based on environment
const createLoggerConfig = () => {
  const baseConfig = {
    level: process.env.LOG_LEVEL ?? "info",
  };

  if (process.env.NODE_ENV !== "production") {
    // In development, use multistream to log to both console and file
    const streams = [
      // Pretty print to console
      {
        level: baseConfig.level,
        stream: pino.transport({
          target: "pino-pretty",
          options: {
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
            colorize: true,
          },
        }),
      },
      // Also write to file for debugging
      // {
      //   level: "debug", // Capture more detail in file
      //   stream: pino.destination({
      //     dest: join(
      //       process.cwd(),
      //       "logs",
      //       `kernel-${new Date().toISOString().split("T")[0]}.log`,
      //     ),
      //     minLength: 4096,
      //     sync: false,
      //   }),
      // },
    ];

    return pino({ level: baseConfig.level }, pino.multistream(streams));
  } else {
    // Production configuration
    const destination = pino.destination({
      minLength: 4096,
      sync: false,
    });
    return pino(baseConfig, destination);
  }
};

export const logger = createLoggerConfig();
import path = require("path");
import pino, { Logger } from "pino";

const getLogLevel = () => {
  // Allow command-line overrides of the log level.
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
  // Avoid distracting log output during test execution.
  if (process.env.NODE_ENV === "test") return "fatal";
  // Default to level "info"
  return "info";
};

const rootLogger = pino({
  level: getLogLevel(),
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      singleLine: !process.env.LOGGER_MULTI_LINE,
      translateTime: "yyyy-mm-dd HH:MM:ss.l",
      ignore: "pid,hostname",
    },
  },
});

// Example use: const logger = createLogger(__filename);
export const createLogger = (filename: string): Logger => rootLogger.child({ name: path.basename(filename) });

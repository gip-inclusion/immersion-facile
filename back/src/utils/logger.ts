import path = require("path");
import pino, { Logger } from "pino";
import { PrettyOptions } from "pino-pretty";

const getLogLevel = () => {
  // Allow command-line overrides of the log level.
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
  // Avoid distracting log output during test execution.
  if (process.env.NODE_ENV === "test") return "fatal";
  // Default to level "info"
  return "info";
};

const getPrettyPrintOptions = (): PrettyOptions => {
  const defaultOptions: PrettyOptions = {
    translateTime: "yyyy-mm-dd HH:MM:ss.l",
  };

  if (process.env.NODE_ENV === "production") {
    return defaultOptions;
  }

  return {
    ...defaultOptions,
    colorize: true,
    ignore: "pid,hostname",
  };
};

const rootLogger = pino({
  level: getLogLevel(),
  prettyPrint: getPrettyPrintOptions(),
});

// Example use: const logger = createLogger(__filename);
export const createLogger = (filename: string): Logger => {
  return rootLogger.child({ name: path.basename(filename) });
};

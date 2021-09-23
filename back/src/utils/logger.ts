import pino from "pino";

const getLogLevel = () => {
  // Allow command-line overrides of the log level.
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
  // Avoid distracting log output during test execution.
  if (process.env.NODE_ENV === "test") return "fatal";
  // Default to level "info"
  return "info";
};

const getPrettyPrintOptions = () => {
  // Don't pretty-print in prod.
  if (process.env.NODE_ENV === "production") {
    return undefined;
  }
  return {
    colorize: true,
    translateTime: "yyyy-mm-dd HH:MM:ss.l",
    ignore: "pid,hostname",
  };
};

export const logger = pino({
  level: getLogLevel(),
  prettyPrint: getPrettyPrintOptions(),
});

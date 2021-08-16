import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV !== "test" ? "info" : "error",
  prettyPrint: process.env.NODE_ENV !== "production",
});

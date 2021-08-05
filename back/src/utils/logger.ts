import pino from "pino";

export const logger = pino({
  level: "info",
  prettyPrint: process.env.NODE_ENV !== "production",
});

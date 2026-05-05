import cors, { type CorsOptions } from "cors";
import type { RequestHandler } from "express";
import type { AppConfig } from "./appConfig";

export const makeCorsOptions = (config: AppConfig): CorsOptions => {
  const allowedOrigins = config.corsAllowedOrigins;

  return {
    credentials: true,
    optionsSuccessStatus: 204,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);

      return callback(
        new Error(`CORS blocked: unauthorized origin '${origin}'`),
      );
    },
  };
};

export const makeCorsPolicy = (config: AppConfig): RequestHandler =>
  cors(makeCorsOptions(config));

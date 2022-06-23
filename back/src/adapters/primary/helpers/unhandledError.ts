import { Request, Response } from "express";
import { createLogger } from "../../../utils/logger";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";

const logger = createLogger(__filename);

export const unhandledError = (error: any, req: Request, res: Response) => {
  const stack = JSON.stringify(error.stack, null, 2);
  logger.error(
    {
      error,
      errorMessage: error.message,
      stack,
      request: {
        path: req.path,
        method: req.method,
        body: req.body,
      },
    },
    "Unhandled error",
  );

  notifyObjectDiscord({
    _message: `Unhandled Error : ${error.message}`,
    routePath: req.path,
    routeMethod: req.method,
    stack,
  });

  res.status(500);

  return res.json({ errors: toValidJSONObjectOrString(error) });
};

const toValidJSONObjectOrString = (
  error: any,
): string | { [key: string]: string } => {
  try {
    return JSON.parse(error.message);
  } catch (_) {
    return error.message;
  }
};

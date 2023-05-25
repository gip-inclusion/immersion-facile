import axios from "axios";
import { Request, Response } from "express";
import { ZodError } from "zod";
import { createLogger } from "../../../utils/logger";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";

const logger = createLogger(__filename);
const _message = "Unhandled Error";

export class UnhandledError extends Error {
  constructor(
    public override readonly message: string = "Unhandled Error",
    public override readonly cause: Error,
  ) {
    super();
    // Error.captureStackTrace(this, this.constructor);
    this.name = "UnhandledError";
    this.message = message;
  }
}

export const unhandledError = (error: any, req: Request, res: Response) => {
  if (axios.isAxiosError(error)) {
    const errorResponse = error.response;
    logErrorAndNotifyDiscord("Axios", req, {
      message: error.message,
      method: error.config.method,
      url: error.config.url,
      path: errorResponse?.request?.path,
      ...(error.config.data ? { requestBody: error.config.data } : {}),
      ...(errorResponse
        ? {
            httpStatus: errorResponse.status,
            responseBody: errorResponse.data,
          }
        : {}),
    });
  } else if (error instanceof ZodError) {
    logErrorAndNotifyDiscord("Zod", req, {
      zodErrors: error.errors.map(
        (issue) => `${issue.path.join(".")} - ${issue.code} - ${issue.message}`,
      ),
    });
  } else {
    error instanceof Error
      ? logErrorAndNotifyDiscord("Unknown Error", req, {
          constructorName: error.constructor.name,
          name: error.name,
          message: error.message,
          ...(error.cause ? { cause: error.cause } : {}),
          ...(error.stack ? { stack: error.stack } : {}),
        })
      : logErrorAndNotifyDiscord("Not instance of Error", req, {
          typeof: typeof error,
          value: JSON.stringify(error),
        });
  }

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

const logErrorAndNotifyDiscord = (
  type: string,
  { path, method, body }: Request,
  otherContent: object,
): void => {
  logger.error(
    {
      type,
      request: {
        path,
        method,
        body,
      },
      ...otherContent,
    },
    _message,
  );
  notifyObjectDiscord({
    _message,
    type,
    request: {
      path,
      method,
    },
    ...otherContent,
  });
};

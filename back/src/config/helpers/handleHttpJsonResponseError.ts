import * as Sentry from "@sentry/node";
import { isAxiosError } from "axios";
import { Request, Response } from "express";
import { ZodError } from "zod";
import { LoggerParamsWithMessage, createLogger } from "../../utils/logger";
import { notifyObjectDiscord } from "../../utils/notifyDiscord";
import { HttpError } from "./httpErrors";

const logger = createLogger(__filename);

type ErrorObject = {
  errorMessage: string;
  status: number;
  issues?: string[];
};

export const handleHttpJsonResponseError = (
  req: Request,
  res: Response,
  error: any,
): Response<any, Record<string, any>> => {
  Sentry.captureException(error);
  return error instanceof HttpError
    ? res
        .status(error.httpCode)
        .json({ errors: toValidJSONObjectOrString(error) })
    : onNotHttpError(error, req, res);
};

export const handleHttpJsonResponseErrorForApiV2 = (
  req: Request,
  res: Response,
  error: any,
): Response<any, Record<string, ErrorObject>> =>
  error instanceof HttpError
    ? res.status(error.httpCode).json({
        ...(error.issues ? { issues: error.issues } : {}),
        message: toValidJSONObjectOrString(error),
        status: error.httpCode,
      })
    : onNotHttpError(error, req, res);

export class UnhandledError extends Error {
  constructor(
    public override readonly message: string,
    public override readonly cause: Error,
  ) {
    super();
    this.name = "UnhandledError";
    this.message = message;
  }
}

const onNotHttpError = (error: any, req: Request, res: Response) => {
  if (isAxiosError(error)) {
    logErrorAndNotifyDiscord("AxiosError", req, {
      message: error.message,
      method: error.config?.method,
      url: error.config?.url,
      ...(error.config?.data ? { requestBody: error.config.data } : {}),
      ...(error.response
        ? {
            httpStatus: error.response.status,
            responseBody: error.response.data,
            path: error.response?.request?.path,
          }
        : {}),
    });
  } else if (error instanceof ZodError) {
    logErrorAndNotifyDiscord("ZodError", req, {
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

  return res.status(500).json({ errors: toValidJSONObjectOrString(error) });
};

const logErrorAndNotifyDiscord = (
  type: string,
  { path, method, body }: Request,
  otherContent: object,
): void => {
  const params: LoggerParamsWithMessage = {
    message: `Unhandled Error of ${type}`,
    request: {
      path,
      method,
      body,
    },
    ...otherContent,
  };

  logger.error(params);
  notifyObjectDiscord(params);
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

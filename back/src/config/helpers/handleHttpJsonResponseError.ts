import * as Sentry from "@sentry/node";
import { isAxiosError } from "axios";
import { Request, Response } from "express";
import { HttpError, HttpErrorResponseBody } from "shared";
import { ZodError } from "zod";
import { LoggerParamsWithMessage, createLogger } from "../../utils/logger";
import { notifyObjectDiscord } from "../../utils/notifyDiscord";

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
  return handleHttpJsonResponseErrorForApiV2(req, res, error);
};

export const handleHttpJsonResponseErrorForApiV2 = (
  req: Request,
  res: Response,
  error: any,
): Response<any, Record<string, ErrorObject>> => {
  return error instanceof HttpError
    ? res.status(error.httpCode).json({
        ...(error.issues ? { issues: error.issues } : {}),
        message: error.message,
        status: error.httpCode,
      } satisfies HttpErrorResponseBody)
    : onNotHttpError(error, req, res);
};

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
            path: error.response?.request?.path,
            responseBody: error.response.data,
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

  return res.status(500).json({
    message: error.message,
    status: 500,
  } satisfies HttpErrorResponseBody);
};

const logErrorAndNotifyDiscord = (
  type: string,
  { path, method }: Request,
  otherContent: object,
): void => {
  const params: LoggerParamsWithMessage = {
    message: `Unhandled Error of ${type}`,
    request: {
      path,
      method,
    },
    ...otherContent,
  };

  logger.error(params);
  notifyObjectDiscord(params);
};

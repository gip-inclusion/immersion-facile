import { Request, Response } from "express";
import { HttpClientError } from "shared/src/httpClient/errors/4xxClientError.error";
import { HttpServerError } from "shared/src/httpClient/errors/5xxServerError.error";
import { HttpError, UnauthorizedError } from "./httpErrors";
import { unhandledError } from "./unhandledError";

export const handleHttpJsonResponseError = (
  req: Request,
  res: Response,
  error: any,
): Response<any, Record<string, any>> => {
  if (!isManagedError(error)) return unhandledError(error, req, res);

  if (error instanceof UnauthorizedError)
    res.setHeader("WWW-Authenticate", "Basic");

  res.status(error.httpCode);

  return res.json({ errors: toValidJSONObjectOrString(error) });
};

const isManagedError = (error: unknown): boolean =>
  error instanceof HttpClientError ||
  error instanceof HttpServerError ||
  error instanceof HttpError;

const toValidJSONObjectOrString = (
  error: HttpError,
): string | { [key: string]: string } => {
  try {
    return JSON.parse(error.message);
  } catch (_) {
    return error.message;
  }
};

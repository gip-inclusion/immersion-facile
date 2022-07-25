import { HttpClientError } from "shared/src/serenity-http-client";
import { HttpServerError } from "shared/src/serenity-http-client";
import { Request, Response } from "express";
import { HttpError, UnauthorizedError } from "./httpErrors";
import { unhandledError } from "./unhandledError";

export const handleHttpJsonResponseError = (
  req: Request,
  res: Response,
  error: any,
): Response<any, Record<string, any>> => {
  if (!isManagedError(error)) return unhandledError(error, req, res);

  if (error instanceof HttpError) {
    if (error instanceof UnauthorizedError)
      res.setHeader("WWW-Authenticate", "Basic");

    res.status(error.httpCode);

    return res.json({ errors: toValidJSONObjectOrString(error) });
  }

  if (error instanceof HttpClientError || error instanceof HttpServerError) {
    res.status(error.httpStatusCode);

    return res.json(toJSONObject(error));
  }

  throw Error("Should never reach there");
};

const isManagedError = (error: unknown): boolean =>
  error instanceof HttpError ||
  error instanceof HttpClientError ||
  error instanceof HttpServerError;

const toJSONObject = (error: HttpClientError | HttpServerError) => ({
  _message: error.message,
  _name: error.name,
  stack: error.stack,
  cause: error.cause?.message,
});

const toValidJSONObjectOrString = (
  error: HttpError,
): string | { [key: string]: string } => {
  try {
    return JSON.parse(error.message);
  } catch (_) {
    return error.message;
  }
};

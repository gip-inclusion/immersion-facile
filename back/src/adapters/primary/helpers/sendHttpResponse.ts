import { Request, Response } from "express";
import { HttpClientError } from "shared/src/httpClient/errors/4xxClientError.error";
import { HttpServerError } from "shared/src/httpClient/errors/5xxServerError.error";
import { HttpError, UnauthorizedError } from "./httpErrors";
import { unhandledError } from "./unhandledError";

export const sendHttpResponse = async (
  expressRequest: Request,
  expressResponse: Response,
  callback: () => Promise<unknown>,
) => {
  try {
    const serializableResponse = await callback();
    expressResponse.status(200);

    return expressResponse.json(serializableResponse ?? { success: true });
  } catch (error: any) {
    handleHttpJsonResponseError(expressRequest, expressResponse, error);
  }
};

export const handleHttpJsonResponseError = (
  req: Request,
  res: Response,
  error: any,
): Response<any, Record<string, any>> => {
  if (!isManagedError(error)) return unhandledError(error, req, res);

  // Current application wide error management
  if (error instanceof HttpError) {
    if (error instanceof UnauthorizedError)
      res.setHeader("WWW-Authenticate", "Basic");

    res.status(error.httpCode);

    return res.json({ errors: toValidJSONObjectOrString(error) });
  }

  return res.json(toJSONObject(error));
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

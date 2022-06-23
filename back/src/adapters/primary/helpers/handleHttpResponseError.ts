import { Request, Response } from "express";
import { HttpError, UnauthorizedError } from "./httpErrors";
import { unhandledError } from "./unhandledError";

export const handleHttpResponseError = (
  req: Request,
  res: Response,
  error: any,
) => {
  if (!(error instanceof HttpError)) return unhandledError(error, req, res);

  if (error instanceof UnauthorizedError)
    res.setHeader("WWW-Authenticate", "Basic");

  res.status(error.httpCode);

  return res.json({ errors: toValidJSONObjectOrString(error) });
};

const toValidJSONObjectOrString = (
  error: HttpError,
): string | { [key: string]: string } => {
  try {
    return JSON.parse(error.message);
  } catch (_) {
    return error.message;
  }
};

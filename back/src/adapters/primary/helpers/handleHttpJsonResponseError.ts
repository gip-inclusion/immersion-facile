import { Request, Response } from "express";
import { HttpError } from "./httpErrors";
import { unhandledError } from "./unhandledError";

export const handleHttpJsonResponseError = (
  req: Request,
  res: Response,
  error: any,
): Response<any, Record<string, any>> => {
  if (!isManagedError(error)) return unhandledError(error, req, res);

  if (error instanceof HttpError) {
    res.status(error.httpCode);
    if (error.httpCode === 409) {
      return unhandledError(error, req, res);
    }

    return res.json({ errors: toValidJSONObjectOrString(error) });
  }

  throw Error("Should never reach there");
};

const isManagedError = (error: unknown): boolean => error instanceof HttpError;

const toValidJSONObjectOrString = (
  error: HttpError,
): string | { [key: string]: string } => {
  try {
    return JSON.parse(error.message);
  } catch (_) {
    return error.message;
  }
};

import type { Request, Response } from "express";
import { handleHttpJsonResponseError } from "./handleHttpJsonResponseError";

export const sendHttpResponse = <T>(
  request: Request<any, any, any, any, any>,
  response: Response<T>,
  callback: () => Promise<T extends Record<string, never> ? void : T>,
) =>
  callback()
    .then((result) => {
      response.json(result as T);
    })
    .catch((error) => handleHttpJsonResponseError(request, response, error));

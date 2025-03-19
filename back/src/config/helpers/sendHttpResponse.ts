import type { Request, Response } from "express";
import { handleHttpJsonResponseError } from "./handleHttpJsonResponseError";

export const sendHttpResponse = async <T>(
  request: Request<any, any, any, any, any>,
  response: Response<T>,
  callback: () => Promise<T extends Record<string, never> ? void : T>,
) => {
  try {
    const useCaseResult = await callback();
    response.json(useCaseResult as T);
    return;
  } catch (error: any) {
    handleHttpJsonResponseError(request, response, error);
  }
};

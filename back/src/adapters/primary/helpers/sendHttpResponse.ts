import { Request, Response } from "express";
import { handleHttpJsonResponseError } from "./handleHttpJsonResponseError";

export const sendHttpResponse = async (
  request: Request<any, any, any, any, any>,
  response: Response,
  callback: () => Promise<unknown>,
) => {
  try {
    const useCaseResult = await callback();
    const { method } = request;
    if (method === "GET" && !useCaseResult) {
      return response.status(200).json(useCaseResult);
    }
    return response.status(200).json(useCaseResult);
  } catch (error: any) {
    handleHttpJsonResponseError(request, response, error);
  }
};

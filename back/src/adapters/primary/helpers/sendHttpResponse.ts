import { Request, Response } from "express";
import { handleHttpJsonResponseError } from "./handleHttpJsonResponseError";

export const sendHttpResponse = async (
  request: Request,
  response: Response,
  callback: () => Promise<unknown>,
) => {
  try {
    return response.status(200).json((await callback()) ?? { success: true });
  } catch (error: any) {
    handleHttpJsonResponseError(request, response, error);
  }
};

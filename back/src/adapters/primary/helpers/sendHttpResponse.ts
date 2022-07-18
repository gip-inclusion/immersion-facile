import { Request, Response } from "express";
import { handleHttpJsonResponseError } from "./handleHttpJsonResponseError";

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

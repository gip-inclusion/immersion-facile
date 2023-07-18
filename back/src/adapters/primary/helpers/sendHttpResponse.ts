import { Request, Response } from "express";
import {
  handleHttpJsonResponseError,
  handleHttpJsonResponseErrorForApiV2,
} from "./handleHttpJsonResponseError";

export const sendHttpResponse = async (
  request: Request<any, any, any, any, any>,
  response: Response,
  callback: () => Promise<unknown>,
) => {
  try {
    const useCaseResult = await callback();
    return response.json(useCaseResult);
  } catch (error: any) {
    handleHttpJsonResponseError(request, response, error);
  }
};

export const sendHttpResponseForApiV2 = async (
  request: Request<any, any, any, any, any>,
  response: Response,
  callback: () => Promise<unknown>,
) => {
  try {
    const useCaseResult = await callback();
    return response.json(useCaseResult);
  } catch (error: any) {
    handleHttpJsonResponseErrorForApiV2(request, response, error);
  }
};

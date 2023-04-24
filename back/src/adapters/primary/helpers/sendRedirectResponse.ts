import { Request, Response } from "express";
import { AbsoluteUrl } from "shared";
import { handleHttpJsonResponseError } from "./handleHttpJsonResponseError";

export const sendRedirectResponse = async (
  request: Request,
  response: Response,
  redirectUrlCallback: () => Promise<AbsoluteUrl>,
) => {
  try {
    return response.status(302).redirect(await redirectUrlCallback());
  } catch (error: any) {
    handleHttpJsonResponseError(request, response, error);
  }
};

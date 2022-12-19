import { Request, Response } from "express";
import { AbsoluteUrl, ManagedRedirectError, RawRedirectError } from "shared";
import { createLogger } from "../../../utils/logger";
import { handleHttpJsonResponseError } from "./handleHttpJsonResponseError";

const logger = createLogger(__filename);
export const sendRedirectResponseWithManagedErrors = async (
  req: Request,
  res: Response,
  callback: () => Promise<AbsoluteUrl>,
  handleManagedRedirectResponseError: (
    error: ManagedRedirectError,
    res: Response,
  ) => void,
  handleRawRedirectResponseError: (
    error: RawRedirectError,
    res: Response,
  ) => void,
) => {
  try {
    return res.status(302).redirect(await callback());
  } catch (error: any) {
    const stack = JSON.stringify(error.stack, null, 2);
    logger.error(
      {
        error,
        errorMessage: error.message,
        stack,
        request: {
          path: req.path,
          method: req.method,
          body: req.body,
        },
      },
      "Redirect error",
    );

    if (error instanceof ManagedRedirectError)
      return handleManagedRedirectResponseError(error, res);

    if (error instanceof RawRedirectError)
      return handleRawRedirectResponseError(error, res);

    return handleHttpJsonResponseError(req, res, error);
  }
};

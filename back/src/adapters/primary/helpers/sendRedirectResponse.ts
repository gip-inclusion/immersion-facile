import { Request, Response } from "express";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { createLogger } from "../../../utils/logger";
import { handleHttpJsonResponseError } from "./handleHttpJsonResponseError";
import { ManagedRedirectError, RawRedirectError } from "./redirectErrors";

const logger = createLogger(__filename);
export const sendRedirectResponse = async (
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
    const redirectUrl = await callback();
    res.status(302);
    return res.redirect(redirectUrl);
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

import type { Request, Response } from "express";
import {
  type AbsoluteUrl,
  FTConnectError,
  ManagedFTConnectError,
} from "shared";
import { createLogger } from "../../utils/logger";
import { handleHttpJsonResponseError } from "./handleHttpJsonResponseError";

const logger = createLogger(__filename);
export const sendRedirectResponseWithManagedErrors = async (
  req: Request,
  res: Response,
  callback: () => Promise<AbsoluteUrl>,
  handleManagedRedirectResponseError: (
    error: ManagedFTConnectError,
    res: Response,
  ) => void,
  handleRawRedirectResponseError: (
    error: FTConnectError,
    res: Response,
  ) => void,
) => {
  try {
    return res.status(302).redirect(await callback());
  } catch (error: any) {
    logger.error({
      error,
      request: {
        path: req.path,
        method: req.method,
      },
      message: "Redirect error",
    });

    if (error instanceof ManagedFTConnectError)
      return handleManagedRedirectResponseError(error, res);

    if (error instanceof FTConnectError)
      return handleRawRedirectResponseError(error, res);

    return handleHttpJsonResponseError(req, res, error);
  }
};

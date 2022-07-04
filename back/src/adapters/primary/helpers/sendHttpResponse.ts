import { Request, Response } from "express";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { deleteFileAndParentFolder } from "../../../utils/filesystemUtils";
import { createLogger } from "../../../utils/logger";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import { handleHttpResponseError } from "./handleHttpResponseError";
import { ManagedRedirectError, RawRedirectError } from "./redirectErrors";

const logger = createLogger(__filename);

export const sendHttpResponse = async (
  request: Request,
  res: Response,
  callback: () => Promise<unknown>,
) => {
  try {
    const response = await callback();
    res.status(200);

    return res.json(response ?? { success: true });
  } catch (error: any) {
    handleHttpResponseError(request, res, error);
  }
};

//prettier-ignore
export const sendRedirectResponse = async (
  req: Request,
  res: Response,
  callback: () => Promise<AbsoluteUrl>,
  handleManagedRedirectResponseError: (error: ManagedRedirectError, res: Response) => void,
  handleRawRedirectResponseError: (error: RawRedirectError, res: Response ) => void,
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

    return handleHttpResponseError(req, res, error);
  }
};

export const sendZipResponse = async (
  req: Request,
  res: Response,
  callback: () => Promise<string>,
) => {
  try {
    const archivePath = await callback();

    res.status(200);
    res.setHeader("content-type", "application/zip");
    return res.download(archivePath, (err?: Error) => {
      if (err) notifyObjectDiscord(err);
      deleteFileAndParentFolder(archivePath);
    });
  } catch (error: any) {
    handleHttpResponseError(req, res, error);
  }
};

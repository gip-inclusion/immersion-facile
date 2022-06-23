import { Request, Response } from "express";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { AuthChecker } from "../../../domain/auth/AuthChecker";
import { deleteFileAndParentFolder } from "../../../utils/filesystemUtils";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import { handleHttpResponseError } from "./handleHttpResponseError";
import { ManagedRedirectError, RawRedirectError } from "./redirectErrors";
import { unhandledError } from "./unhandledError";

const authenticationCheck = (req: Request, authChecker?: AuthChecker): void => {
  if (authChecker) {
    authChecker.checkAuth(req);
  }
};

export const sendHttpResponse = async (
  request: Request,
  res: Response,
  callback: () => Promise<unknown>,
  authChecker?: AuthChecker,
) => {
  try {
    authenticationCheck(request, authChecker);

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
  authChecker?: AuthChecker,
) => {
  try {
    authenticationCheck(req, authChecker);

    const redirectUrl = await callback();
    res.status(302);
    return res.redirect(redirectUrl);
  } catch (error: unknown) {
    if (error instanceof ManagedRedirectError)
      return handleManagedRedirectResponseError(error, res);

    if (error instanceof RawRedirectError)
      return handleRawRedirectResponseError(error, res);

    return unhandledError(error, req, res);
  }
};

export const sendZipResponse = async (
  req: Request,
  res: Response,
  callback: () => Promise<string>,
  authChecker?: AuthChecker,
) => {
  try {
    authenticationCheck(req, authChecker);

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

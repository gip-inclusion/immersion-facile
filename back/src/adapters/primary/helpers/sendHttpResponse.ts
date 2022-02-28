import { Request, Response } from "express";
import { AuthChecker } from "../../../domain/auth/AuthChecker";
import { createLogger } from "../../../utils/logger";
import { HttpError, UnauthorizedError } from "./httpErrors";
import { deleteFile } from "../../../utils/filesystemUtils";

const logger = createLogger(__filename);

// TODO better type for error ?
const handleResponseError = (res: Response, error: any) => {
  if (error instanceof HttpError) {
    if (error instanceof UnauthorizedError) {
      res.setHeader("WWW-Authenticate", "Basic");
    }
    res.status(error.httpCode);
  } else {
    logger.error(error, "Uncaught error");
    res.status(500);
  }

  let errors: any;
  try {
    errors = JSON.parse(error.message);
  } catch (e) {
    errors = error.message;
  }

  return res.json({ errors });
};

const authenticationCheck = (req: Request, authChecker?: AuthChecker): void => {
  if (authChecker) {
    authChecker.checkAuth(req);
  }
};

export const sendHttpResponse = async (
  req: Request,
  res: Response,
  callback: () => Promise<unknown>,
  authChecker?: AuthChecker,
) => {
  try {
    authenticationCheck(req, authChecker);

    const response = await callback();
    res.status(200);

    return res.json(response ?? { success: true });
  } catch (error: any) {
    handleResponseError(res, error);
  }
};

export const sendRedirectResponse = async (
  req: Request,
  res: Response,
  callback: () => Promise<string>,
  authChecker?: AuthChecker,
) => {
  try {
    authenticationCheck(req, authChecker);

    const redirectUrl = await callback();
    res.status(302);

    return res.redirect(redirectUrl);
  } catch (error: any) {
    handleResponseError(res, error);
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

    return res.download(archivePath, () => {
      deleteFile(archivePath);
    });
  } catch (error: any) {
    handleResponseError(res, error);
  }
};

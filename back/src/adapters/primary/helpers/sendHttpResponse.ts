import { Request, Response } from "express";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { queryParamsAsString } from "shared/src/utils/queryParams";
import { AuthChecker } from "../../../domain/auth/AuthChecker";
import { deleteFileAndParentFolder } from "../../../utils/filesystemUtils";
import { createLogger } from "../../../utils/logger";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import { HttpError, UnauthorizedError } from "./httpErrors";

const logger = createLogger(__filename);

// TODO better type for error ?
const handleResponseError = (req: Request, res: Response, error: any) => {
  if (error instanceof HttpError) {
    if (error instanceof UnauthorizedError) {
      res.setHeader("WWW-Authenticate", "Basic");
    }
    res.status(error.httpCode);
  } else {
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
      "Unhandled error",
    );

    notifyObjectDiscord({
      _message: `Unhandled Error : ${error.message}`,
      routePath: req.path,
      routeMethod: req.method,
      stack,
    });
    res.status(500);
  }

  let errors: any;
  try {
    errors = JSON.parse(error.message);
  } catch (_) {
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
    handleResponseError(req, res, error);
  }
};

type RedirectErrorQueryParams =
  | {
      title: string;
      message: string;
    }
  | {
      kind: string;
    };

export const sendRedirectResponse = async (
  req: Request,
  res: Response,
  callback: () => Promise<AbsoluteUrl>,
  authChecker?: AuthChecker,
) => {
  try {
    authenticationCheck(req, authChecker);

    const redirectUrl = await callback();
    res.status(302);
    return res.redirect(redirectUrl);
  } catch (error: any) {
    const message: string = error?.message ?? error.toString();
    console.log("MESSAGE", message);
    const toObject = JSON.parse(message);

    const queryParams = toObject.kind
      ? {
          kind: toObject.kind,
        }
      : {
          title: toObject.title ?? "Une erreur est survenue",
          message:
            toObject.message ??
            error.message ??
            "Si vous êtes bloqués dans votre démarches n'hésitez pas à contacter directement l'équipe Immersion Facilité !",
        };

    const toQueryParam =
      queryParamsAsString<RedirectErrorQueryParams>(queryParams);
    res.redirect(`http://localhost:3000/error?${toQueryParam}`);
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
    handleResponseError(req, res, error);
  }
};

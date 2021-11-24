import { NextFunction, Request, Response } from "express";
import { TokenExpiredError } from "jsonwebtoken";
import { MagicLinkPayload } from "../../shared/tokens/MagicLinkPayload";
import { createLogger } from "../../utils/logger";
import { makeVerifyJwt } from "./../../domain/auth/jwt";
import { AppConfig } from "./appConfig";
import jwt from "jsonwebtoken";
import { createRenewMagicLinkUrl } from "./config";

const logger = createLogger(__filename);

export const createAuthMiddleware =
  (config: AppConfig) => (req: Request, res: Response, next: NextFunction) => {
    const verifyJwt = makeVerifyJwt(config.jwtPublicKey);

    const pathComponents = req.path.split("/");
    const maybeJwt = pathComponents[pathComponents.length - 1];
    if (!maybeJwt) {
      sendForbiddenError(res, new Error("impossible to authenticate"));
    }

    verifyJwt(maybeJwt as string, (err, payload) => {
      if (err) {
        if (err instanceof TokenExpiredError) {
          // Decode the payload without verifying it to extract the application id and role.
          const expiredPayload = jwt.decode(maybeJwt) as MagicLinkPayload;
          if (!expiredPayload) {
            sendForbiddenError(res, err);
          } else {
            sendNeedsRenewedLinkError(res, err);
          }

          return;
        }

        sendForbiddenError(res, err);
        return;
      }
      req.jwtPayload = payload as MagicLinkPayload;
      next();
    });
  };

const sendForbiddenError = (res: Response, err: Error) => {
  logger.error({ err }, "authentication failed");
  res.status(403);
  return res.json({
    message: "Provided token is invalid",
  });
};

const sendNeedsRenewedLinkError = (res: Response, err: Error) => {
  logger.info({ err }, "unsupported or expired magic link used");
  res.status(403);
  return res.json({
    message: "Le lien magique est périmé",
    needsNewMagicLink: true,
  });
};

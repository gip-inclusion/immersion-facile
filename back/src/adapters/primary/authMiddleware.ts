import { NextFunction, Request, Response } from "express";
import { MagicLinkPayload } from "../../shared/tokens/MagicLinkPayload";
import { createLogger } from "../../utils/logger";
import { makeVerifyJwt } from "./../../domain/auth/jwt";
import { AppConfig } from "./appConfig";

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

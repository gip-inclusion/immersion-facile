import { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../../domain/auth/jwt";
import { MagicLinkPayload } from "../../domain/auth/MagicLinkPayload";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const pathComponents = req.path.split("/");
  const maybeJwt = pathComponents[pathComponents.length - 1];
  if (!maybeJwt) {
    sendForbiddenError(res, new Error("impossible to authentify"));
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

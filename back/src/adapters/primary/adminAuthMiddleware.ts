import { NextFunction, Request, Response } from "express";
import { makeVerifyJwtES256 } from "../../domain/auth/jwt";
import { TimeGateway } from "../../domain/core/ports/TimeGateway";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

export const makeAdminAuthMiddleware = (
  jwtPublicKey: string,
  timeGateway: TimeGateway,
) => {
  const verifyJwt = makeVerifyJwtES256<"backOffice">(jwtPublicKey);
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: `You need to authenticate first` });
    }
    try {
      const payload = verifyJwt(req.headers.authorization);
      if (!payload.exp) {
        return res.status(401).json({ error: "Token is expired" });
      }
      const expirationDate = new Date(payload.exp * 1000);

      if (timeGateway.now() > expirationDate) {
        return res.status(401).json({ error: "Token is expired" });
      }

      req.payloads = { backOffice: payload };
      return next();
    } catch (error) {
      logger.error(
        { error, jwt: req.headers.authorization },
        "Provided token is invalid",
      );
      res.status(401);
      return res.json({
        error: "Provided token is invalid",
      });
    }
  };
};

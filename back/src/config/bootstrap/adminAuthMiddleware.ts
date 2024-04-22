import { NextFunction, Request, Response } from "express";
import { makeVerifyJwtES256 } from "../../domains/core/jwt";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

export const makeAdminAuthMiddleware = (jwtPublicKey: string) => {
  const verifyJwt = makeVerifyJwtES256<"inclusionConnect">(jwtPublicKey);
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: "You need to authenticate first" });
    }
    try {
      const payload = verifyJwt(req.headers.authorization);
      if (!payload.userId)
        return res.status(401).json({ errors: "Accès refusé" });

      req.payloads = { inclusion: payload };
      return next();
    } catch (error: any) {
      if ("name" in error && error.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token is expired" });
      }
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

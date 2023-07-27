import { NextFunction, Request, Response } from "express";
import { makeVerifyJwtES256 } from "../../../../domain/auth/jwt";
import { forbidden, unauthorized } from "../../middlewareHelpers";

export const createInclusionConnectedMiddleware = (jwtSecret: string) => {
  const verifyJwt = makeVerifyJwtES256<"inclusionConnect">(jwtSecret);

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) return unauthorized(res);

    try {
      const inclusionPayload = verifyJwt(req.headers.authorization);
      req.payloads = { inclusion: inclusionPayload };
      next();
    } catch (error: any) {
      return forbidden(res, error?.message);
    }
  };
};

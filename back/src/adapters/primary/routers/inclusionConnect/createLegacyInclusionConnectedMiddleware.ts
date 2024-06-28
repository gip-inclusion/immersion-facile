import { NextFunction, Request, Response } from "express";
import {
  forbidden,
  unauthorized,
} from "../../../../config/bootstrap/middlewareHelpers";
import { makeVerifyJwtES256 } from "../../../../domains/core/jwt";

export const createLegacyInclusionConnectedMiddleware = (jwtSecret: string) => {
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

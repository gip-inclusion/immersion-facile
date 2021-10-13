import { Request, Response } from "express";
import { AuthChecker } from "../../../domain/auth/AuthChecker";
import { FeatureDisabledError } from "../../../shared/featureFlags";

export class UnauthorizedError extends Error {
  constructor() {
    super("Veuillez authentifier");
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
export class ForbiddenError extends Error {
  constructor() {
    super("Accès refusé");
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
export class NotFoundError extends Error {
  constructor(msg?: any) {
    super(msg);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
export class BadRequestError extends Error {
  constructor(msg?: any) {
    super(msg);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}
export class ConflictError extends Error {
  constructor(msg: any) {
    super(msg);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export const sendHttpResponse = async (
  req: Request,
  res: Response,
  callback: () => Promise<unknown>,
  authChecker?: AuthChecker,
) => {
  try {
    if (authChecker) {
      authChecker.checkAuth(req);
    }
    const response = await callback();
    res.status(200);
    return res.json(response || { success: true });
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      res.setHeader("WWW-Authenticate", "Basic");
      res.status(401);
    } else if (error instanceof ForbiddenError) {
      res.status(403);
    } else if (error instanceof FeatureDisabledError) {
      res.status(404);
    } else if (error instanceof NotFoundError) {
      res.status(404);
    } else if (error instanceof ConflictError) {
      res.status(409);
    } else if (error instanceof BadRequestError) {
      res.status(400);
    } else {
      res.status(400); // TODO: Change this to 500 Internal Server Error.
    }
    return res.json({ errors: error.errors || [error.message] });
  }
};

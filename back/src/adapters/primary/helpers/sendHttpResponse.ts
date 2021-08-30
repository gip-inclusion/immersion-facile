import { Request, Response } from "express";
import { AuthChecker } from "../../../domain/auth/AuthChecker";

export class UnauthorizedError extends Error {
  constructor() {
    super("Veuillez authentifier");
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
export class NotFoundError extends Error {
  constructor(msg: any) {
    super(msg);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export const sendHttpResponse = async (
  req: Request,
  res: Response,
  callback: () => Promise<unknown>,
  authChecker?: AuthChecker
) => {
  try {
    if (authChecker) {
      authChecker.checkAuth(req);
    }
    const response = await callback();
    res.status(200);
    return res.json(response || { success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401);
    } else if (error instanceof NotFoundError) {
      res.status(404);
    } else {
      res.status(400);
    }
    return res.json({ errors: error.errors || [error.message] });
  }
};

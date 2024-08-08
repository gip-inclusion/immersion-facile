import { NextFunction, Request, Response } from "express";
import { errors } from "shared";
import { makeVerifyJwtES256 } from "../../domains/core/jwt";
import { UnitOfWorkPerformer } from "../../domains/core/unit-of-work/ports/UnitOfWorkPerformer";

export const makeInclusionConnectAuthMiddleware = (
  jwtPublicKey: string,
  uowPerformer: UnitOfWorkPerformer,
) => {
  const verifyJwt = makeVerifyJwtES256<"inclusionConnect">(jwtPublicKey);
  return async (req: Request, res: Response, next: NextFunction) => {
    const unauthorizedError = {
      status: errors.user.unauthorized().httpCode,
      message: errors.user.unauthorized().message,
    };
    if (!req.headers.authorization) {
      return res.status(unauthorizedError.status).json(unauthorizedError);
    }
    try {
      const payload = verifyJwt(req.headers.authorization);
      if (!payload.userId)
        return res.status(unauthorizedError.status).json(unauthorizedError);

      const currentIcUser = await uowPerformer.perform((uow) =>
        uow.userRepository.getById(payload.userId),
      );
      if (!currentIcUser)
        throw errors.user.notFound({ userId: payload.userId });

      req.payloads = { inclusion: payload, currentUser: currentIcUser };

      return next();
    } catch (error: any) {
      return res.status(unauthorizedError.status).json({
        status: unauthorizedError.status,
        message:
          "name" in error && error.name === "TokenExpiredError"
            ? "Token is expired"
            : "Provided token is invalid",
      });
    }
  };
};

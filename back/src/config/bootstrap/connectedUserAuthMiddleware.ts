import type { NextFunction, Request, Response } from "express";
import { authExpiredMessage, errors } from "shared";
import { getConnectedUserByUserId } from "../../domains/connected-users/helpers/connectedUser.helper";
import type { DashboardGateway } from "../../domains/core/dashboard/port/DashboardGateway";
import { makeVerifyJwtES256 } from "../../domains/core/jwt";
import type { TimeGateway } from "../../domains/core/time-gateway/ports/TimeGateway";
import type { UnitOfWorkPerformer } from "../../domains/core/unit-of-work/ports/UnitOfWorkPerformer";

export const makeConnectedUserAuthMiddleware = (
  jwtPublicKey: string,
  uowPerformer: UnitOfWorkPerformer,
  dashboardGateway: DashboardGateway,
  timeGateway: TimeGateway,
) => {
  const verifyJwt = makeVerifyJwtES256<"connectedUser">(jwtPublicKey);
  return async (
    req: Request<any, any, any, any>,
    res: Response,
    next: NextFunction,
  ) => {
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

      const currentIcUser = await uowPerformer.perform(async (uow) =>
        getConnectedUserByUserId({
          uow,
          userId: payload.userId,
          dashboardGateway,
          timeGateway,
        }),
      );
      if (!currentIcUser)
        throw errors.user.notFound({ userId: payload.userId });

      req.payloads = { connectedUser: payload, currentUser: currentIcUser };
      return next();
    } catch (error: any) {
      return res.status(unauthorizedError.status).json({
        status: unauthorizedError.status,
        message:
          "name" in error && error.name === "TokenExpiredError"
            ? authExpiredMessage
            : invalidTokenMessage,
      });
    }
  };
};

export const invalidTokenMessage = "Provided token is invalid";

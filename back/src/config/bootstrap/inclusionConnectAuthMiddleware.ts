import type { NextFunction, Request, Response } from "express";
import { connectedUserTokenExpiredMessage, errors } from "shared";
import type { DashboardGateway } from "../../domains/core/dashboard/port/DashboardGateway";
import { makeVerifyJwtES256 } from "../../domains/core/jwt";
import type { TimeGateway } from "../../domains/core/time-gateway/ports/TimeGateway";
import type { UnitOfWorkPerformer } from "../../domains/core/unit-of-work/ports/UnitOfWorkPerformer";
import { getIcUserByUserId } from "../../domains/inclusion-connected-users/helpers/inclusionConnectedUser.helper";

export const makeInclusionConnectAuthMiddleware = (
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
        getIcUserByUserId({
          uow,
          userId: payload.userId,
          dashboardGateway,
          timeGateway,
        }),
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
            ? connectedUserTokenExpiredMessage
            : invalidTokenMessage,
      });
    }
  };
};

export const invalidTokenMessage = "Provided token is invalid";

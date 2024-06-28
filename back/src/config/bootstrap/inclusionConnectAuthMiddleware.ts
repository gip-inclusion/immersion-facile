import { NextFunction, Request, Response } from "express";
import { makeVerifyJwtES256 } from "../../domains/core/jwt";
import { UnitOfWorkPerformer } from "../../domains/core/unit-of-work/ports/UnitOfWorkPerformer";
import { NotFoundError } from "../helpers/httpErrors";

export const makeInclusionConnectAuthMiddleware = (
  jwtPublicKey: string,
  uowPerformer: UnitOfWorkPerformer,
) => {
  const verifyJwt = makeVerifyJwtES256<"inclusionConnect">(jwtPublicKey);
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: "You need to authenticate first" });
    }
    try {
      const payload = verifyJwt(req.headers.authorization);
      if (!payload.userId)
        return res.status(401).json({ errors: "Accès refusé" });

      const currentIcUser = await uowPerformer.perform((uow) =>
        uow.inclusionConnectedUserRepository.getById(payload.userId),
      );
      if (!currentIcUser)
        throw new NotFoundError(`No user found with id : ${payload.userId}`);

      req.payloads = { inclusion: payload, currentUser: currentIcUser };

      return next();
    } catch (error: any) {
      return res.status(401).json({
        error:
          "name" in error && error.name === "TokenExpiredError"
            ? "Token is expired"
            : "Provided token is invalid",
      });
    }
  };
};

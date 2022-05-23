import { Router } from "express";
import {
  immersionApplicationsRoute,
  signApplicationRoute,
  updateApplicationStatusRoute,
} from "shared/src/routes";
import type { AppDependencies } from "../config/createAppDependencies";
import { UnauthorizedError } from "../helpers/httpErrors";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

export const createMagicLinkRouter = (deps: AppDependencies) => {
  const authenticatedRouter = Router({ mergeParams: true });

  authenticatedRouter.use(deps.applicationJwtAuthMiddleware);

  authenticatedRouter
    .route(`/${immersionApplicationsRoute}/:jwt`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req.payloads?.application) throw new UnauthorizedError();
        return deps.useCases.getImmersionApplication.execute({
          id: req.payloads.application.applicationId,
        });
      }),
    )
    .post(async (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req.payloads?.application) throw new UnauthorizedError();
        return deps.useCases.updateImmersionApplication.execute({
          id: req.payloads.application.applicationId,
          immersionApplication: req.body,
        });
      }),
    );

  authenticatedRouter
    .route(`/${updateApplicationStatusRoute}/:jwt`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req?.payloads?.application) throw new UnauthorizedError();
        return deps.useCases.updateImmersionApplicationStatus.execute(
          req.body,
          req.payloads.application,
        );
      }),
    );

  authenticatedRouter
    .route(`/${signApplicationRoute}/:jwt`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req?.payloads?.application) throw new UnauthorizedError();
        return deps.useCases.signImmersionApplication.execute(
          undefined,
          req.payloads.application,
        );
      }),
    );

  return authenticatedRouter;
};

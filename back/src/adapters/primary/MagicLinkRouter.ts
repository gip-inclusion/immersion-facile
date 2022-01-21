import { Router } from "express";
import {
  immersionApplicationsRoute,
  signApplicationRoute,
  updateApplicationStatusRoute,
} from "../../shared/routes";
import { AppDependencies } from "./config";
import { sendHttpResponse } from "./helpers/sendHttpResponse";

export const createMagicLinkRouter = (deps: AppDependencies) => {
  const authenticatedRouter = Router({ mergeParams: true });

  authenticatedRouter.use("/:jwt", deps.jwtAuthMiddleware);

  authenticatedRouter
    .route(`/${immersionApplicationsRoute}/:jwt`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getDemandeImmersion.execute({
          id: req.jwtPayload.applicationId,
        }),
      ),
    )
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.updateDemandeImmersion.execute({
          id: req.jwtPayload.applicationId,
          demandeImmersion: req.body,
        }),
      ),
    );

  authenticatedRouter
    .route(`/${updateApplicationStatusRoute}/:jwt`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.updateImmersionApplicationStatus.execute(
          req.body,
          req.jwtPayload,
        ),
      ),
    );

  authenticatedRouter
    .route(`/${signApplicationRoute}/:jwt`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.signImmersionApplication.execute({}, req.jwtPayload),
      ),
    );

  return authenticatedRouter;
};

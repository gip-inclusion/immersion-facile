import { Router } from "express";
import {
  generateMagicLinkRoute,
  immersionApplicationsRoute,
} from "shared/src/routes";
import { AppDependencies } from "../config";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

export const createAdminRouter = (deps: AppDependencies) => {
  const adminRouter = Router({ mergeParams: true });

  adminRouter
    .route(`/${immersionApplicationsRoute}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(
        req,
        res,
        () => deps.useCases.getImmersionApplication.execute(req.params),
        deps.authChecker,
      ),
    );

  adminRouter.route(`/${generateMagicLinkRoute}`).get(async (req, res) =>
    sendHttpResponse(
      req,
      res,
      () =>
        deps.useCases.generateMagicLink.execute({
          applicationId: req.query.id,
          role: req.query.role,
          expired: req.query.expired === "true",
        } as any),
      deps.authChecker,
    ),
  );

  return adminRouter;
};

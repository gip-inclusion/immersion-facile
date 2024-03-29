import { Router } from "express";
import { unauthenticatedConventionRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";

export const createConventionRouter = (deps: AppDependencies) => {
  const expressRouter = Router();

  const conventionSharedRouter = createExpressSharedRouter(
    unauthenticatedConventionRoutes,
    expressRouter,
  );

  conventionSharedRouter.shareConvention(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.shareConventionByEmail.execute(req.body),
    ),
  );

  conventionSharedRouter.createConvention(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.addConvention.execute(req.body),
    ),
  );

  conventionSharedRouter.findSimilarConventions(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.findSimilarConventions.execute(req.query),
    ),
  );

  conventionSharedRouter.renewMagicLink(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.renewConventionMagicLink.execute(req.query),
    ),
  );

  return expressRouter;
};

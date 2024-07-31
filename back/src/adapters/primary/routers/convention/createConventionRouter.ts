import { Router } from "express";
import {
  authenticatedConventionRoutes,
  errors,
  unauthenticatedConventionRoutes,
} from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";

export const createConventionRouter = (deps: AppDependencies) => {
  const expressRouter = Router();

  const unauthenticatedConventionSharedRouter = createExpressSharedRouter(
    unauthenticatedConventionRoutes,
    expressRouter,
  );

  const authenticatedConventionSharedRouter = createExpressSharedRouter(
    authenticatedConventionRoutes,
    expressRouter,
  );

  unauthenticatedConventionSharedRouter.shareConvention(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.shareConventionByEmail.execute(req.body),
    ),
  );

  unauthenticatedConventionSharedRouter.createConvention(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.addConvention.execute(req.body),
    ),
  );

  unauthenticatedConventionSharedRouter.findSimilarConventions(
    async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.findSimilarConventions.execute(req.query),
      ),
  );

  unauthenticatedConventionSharedRouter.renewMagicLink(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.renewConventionMagicLink.execute(req.query),
    ),
  );

  authenticatedConventionSharedRouter.getApiConsumersByConvention(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () => {
        const currentUser = req.payloads?.currentUser;
        if (!currentUser) throw errors.user.unauthorized();
        return await deps.useCases.getApiConsumersByConvention.execute(
          { conventionId: req.params.conventionId },
          currentUser,
        );
      }),
  );

  return expressRouter;
};

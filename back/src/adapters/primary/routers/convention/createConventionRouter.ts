import { Router } from "express";
import {
  authenticatedConventionRoutes,
  errors,
  flatParamsToGetConventionsForAgencyUserParams,
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
    deps.connectedUserAuthMiddleware,
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

  authenticatedConventionSharedRouter.getConventionsForAgencyUser(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () => {
        const currentUser = req.payloads?.currentUser;
        if (!currentUser) throw errors.user.unauthorized();
        return await deps.useCases.getConventionsForAgencyUser.execute(
          flatParamsToGetConventionsForAgencyUserParams(req.query),
          currentUser,
        );
      }),
  );

  authenticatedConventionSharedRouter.markPartnersErroredConventionAsHandled(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () => {
        const connectedUser = req.payloads?.connectedUser;
        if (!connectedUser) throw errors.user.unauthorized();
        await deps.useCases.markPartnersErroredConventionAsHandled.execute(
          req.body,
          connectedUser,
        );
      }),
  );

  authenticatedConventionSharedRouter.broadcastConventionAgain(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () => {
        const currentUser = req.payloads?.currentUser;
        if (!currentUser) throw errors.user.unauthorized();
        await deps.useCases.broadcastConventionAgain.execute(
          req.body,
          currentUser,
        );
      }),
  );

  return expressRouter;
};

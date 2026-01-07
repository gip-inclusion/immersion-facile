import { Router } from "express";
import {
  authenticatedConventionRoutes,
  flatParamsToGetConventionsForAgencyUserParams,
  flatParamsToGetConventionsWithErroredBroadcastFeedbackParams,
  unauthenticatedConventionRoutes,
} from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";
import { getGenericAuthOrThrow } from "../../../../domains/core/authentication/connected-user/entities/user.helper";

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

  unauthenticatedConventionSharedRouter.shareConvention((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.shareConventionByEmail.execute(req.body),
    ),
  );

  unauthenticatedConventionSharedRouter.createConvention((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.addConvention.execute(req.body),
    ),
  );

  unauthenticatedConventionSharedRouter.findSimilarConventions((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.findSimilarConventions.execute(req.query),
    ),
  );

  authenticatedConventionSharedRouter.getApiConsumersByConvention(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getApiConsumersByConvention.execute(
          req.params,
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  authenticatedConventionSharedRouter.getConventionsForAgencyUser(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getConventionsForAgencyUser.execute(
          flatParamsToGetConventionsForAgencyUserParams(req.query),
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  authenticatedConventionSharedRouter.getConventionsWithErroredBroadcastFeedbackForAgencyUser(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getConventionsWithErroredBroadcastFeedback.execute(
          flatParamsToGetConventionsWithErroredBroadcastFeedbackParams(
            req.query,
          ),
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  authenticatedConventionSharedRouter.markPartnersErroredConventionAsHandled(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.markPartnersErroredConventionAsHandled.execute(
          req.body,
          getGenericAuthOrThrow(req.payloads?.connectedUser),
        ),
      ),
  );

  authenticatedConventionSharedRouter.broadcastConventionAgain(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.broadcastConventionAgain.execute(
          req.body,
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  authenticatedConventionSharedRouter.getConventionLastBroadcastFeedback(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getLastBroadcastFeedback.execute(
          req.params.conventionId,
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  return expressRouter;
};

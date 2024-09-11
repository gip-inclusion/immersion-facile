import { Router } from "express";
import { errors, inclusionConnectedAllowedRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";

export const createInclusionConnectedAllowedRouter = (
  deps: AppDependencies,
): Router => {
  const inclusionConnectedRouter = Router({ mergeParams: true });

  const inclusionConnectedSharedRoutes = createExpressSharedRouter(
    inclusionConnectedAllowedRoutes,
    inclusionConnectedRouter,
  );

  inclusionConnectedSharedRoutes.getInclusionConnectedUser(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getInclusionConnectedUser.execute(
          undefined,
          req.payloads?.inclusion,
        ),
      ),
  );

  inclusionConnectedSharedRoutes.registerAgenciesToUser(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.registerAgencyToInclusionConnectUser.execute(
          req.body,
          req.payloads?.inclusion,
        ),
      ),
  );

  inclusionConnectedSharedRoutes.getInclusionConnectLogoutUrl((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.inclusionConnectLogout.execute({
        idToken: req.query.idToken,
      }),
    ),
  );

  inclusionConnectedSharedRoutes.markPartnersErroredConventionAsHandled(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () => {
        const inclusion = req.payloads?.inclusion;
        if (!inclusion) throw errors.user.unauthorized();
        await deps.useCases.markPartnersErroredConventionAsHandled.execute(
          req.body,
          inclusion,
        );
      }),
  );

  inclusionConnectedSharedRoutes.broadcastConventionAgain(
    deps.inclusionConnectAuthMiddleware,
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

  inclusionConnectedSharedRoutes.getDiscussionByIdForEstablishment(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getDiscussionByIdForEstablishment.execute(
          req.params.discussionId,
          req.payloads?.inclusion,
        ),
      ),
  );

  inclusionConnectedSharedRoutes.updateDiscussionStatus(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req.payloads?.currentUser) throw errors.user.unauthorized();
        return deps.useCases.rejectDiscussionAndSendNotification.execute(
          {
            discussionId: req.params.discussionId,
            ...req.body,
          },
          req.payloads.currentUser,
        );
      }),
  );

  return inclusionConnectedRouter;
};

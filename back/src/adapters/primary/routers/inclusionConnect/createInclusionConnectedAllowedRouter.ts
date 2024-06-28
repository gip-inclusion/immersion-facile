import { Router } from "express";
import { inclusionConnectedAllowedRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { UnauthorizedError } from "../../../../config/helpers/httpErrors";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";
import { createLegacyInclusionConnectedMiddleware } from "./createLegacyInclusionConnectedMiddleware";

export const createInclusionConnectedAllowedRouter = (
  deps: AppDependencies,
): Router => {
  const inclusionConnectedRouter = Router({ mergeParams: true });

  const inclusionConnectedSharedRoutes = createExpressSharedRouter(
    inclusionConnectedAllowedRoutes,
    inclusionConnectedRouter,
  );

  const inclusionConnectedMiddleware = createLegacyInclusionConnectedMiddleware(
    deps.config.jwtPublicKey,
  );

  inclusionConnectedSharedRoutes.getInclusionConnectedUser(
    inclusionConnectedMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getInclusionConnectedUser.execute(
          undefined,
          req.payloads?.inclusion,
        ),
      ),
  );

  inclusionConnectedSharedRoutes.registerAgenciesToUser(
    inclusionConnectedMiddleware,
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
      deps.useCases.inclusionConnectLogout.execute(),
    ),
  );

  inclusionConnectedSharedRoutes.markPartnersErroredConventionAsHandled(
    inclusionConnectedMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () => {
        const inclusion = req.payloads?.inclusion;
        if (!inclusion) throw new UnauthorizedError();
        await deps.useCases.markPartnersErroredConventionAsHandled.execute(
          req.body,
          inclusion,
        );
      }),
  );

  inclusionConnectedSharedRoutes.broadcastConventionAgain(
    deps.adminAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () => {
        const currentUser = req.payloads?.currentUser;
        if (!currentUser) throw new UnauthorizedError();
        await deps.useCases.broadcastConventionAgain.execute(
          req.body,
          currentUser,
        );
      }),
  );

  inclusionConnectedSharedRoutes.getDiscussionByIdForEstablishment(
    inclusionConnectedMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getDiscussionByIdForEstablishment.execute(
          req.params.discussionId,
          req.payloads?.inclusion,
        ),
      ),
  );

  inclusionConnectedSharedRoutes.rejectDiscussion(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req.payloads?.currentUser) throw new UnauthorizedError();
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

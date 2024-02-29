import { Router } from "express";
import { inclusionConnectedAllowedRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { UnauthorizedError } from "../../../../config/helpers/httpErrors";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";
import { createInclusionConnectedMiddleware } from "./createInclusionConnectedMiddleware";

export const createInclusionConnectedAllowedRouter = (
  deps: AppDependencies,
): Router => {
  const inclusionConnectedRouter = Router({ mergeParams: true });

  const inclusionConnectedSharedRoutes = createExpressSharedRouter(
    inclusionConnectedAllowedRoutes,
    inclusionConnectedRouter,
  );

  const inclusionConnectedMiddleware = createInclusionConnectedMiddleware(
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
      deps.useCases.inclusionConnectLogout.execute(req.query),
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

  return inclusionConnectedRouter;
};

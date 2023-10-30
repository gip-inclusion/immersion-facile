import { Router } from "express";
import { match, P } from "ts-pattern";
import { inclusionConnectedAllowedRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import { AppDependencies } from "../../config/createAppDependencies";
import { UnauthorizedError } from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";
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
        deps.useCases.getUserAgencyDashboardUrl.execute(
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

  inclusionConnectedSharedRoutes.markPartnersErroredConventionAsHandled(
    inclusionConnectedMiddleware,
    async (req, res) =>
      sendHttpResponse(req, res, () =>
        match(req.payloads)
          .with({ inclusion: P.not(P.nullish) }, ({ inclusion }) =>
            deps.useCases.markPartnersErroredConventionAsHandled.execute(
              req.body,
              inclusion,
            ),
          )
          .otherwise(() => {
            throw new UnauthorizedError();
          }),
      ),
  );

  return inclusionConnectedRouter;
};

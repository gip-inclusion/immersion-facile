import { Router } from "express";
import { inclusionConnectedAllowedTargets } from "shared";
import { AppDependencies } from "../../config/createAppDependencies";
import {
  createRemoveRouterPrefix,
  RelativeUrl,
} from "../../createRemoveRouterPrefix";
import { ForbiddenError } from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";
import { createInclusionConnectedMiddleware } from "./createInclusionConnectedMiddleware";

export const createInclusionConnectedAllowedRouter = (
  deps: AppDependencies,
): [RelativeUrl, Router] => {
  const inclusionConnectedRouter = Router({ mergeParams: true });
  const { removeRouterPrefix, routerPrefix } = createRemoveRouterPrefix(
    "/inclusion-connected",
  );
  inclusionConnectedRouter.use(
    createInclusionConnectedMiddleware(deps.config.jwtPublicKey),
  );

  inclusionConnectedRouter.get(
    removeRouterPrefix(
      inclusionConnectedAllowedTargets.getInclusionConnectedUser.url,
    ),
    (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getUserAgencyDashboardUrl.execute(
          undefined,
          req.payloads?.inclusion,
        ),
      ),
  );

  // <<<---- should be removed, and getInclusionConnectedUser should be used instead when front is ready
  inclusionConnectedRouter.get(
    removeRouterPrefix(inclusionConnectedAllowedTargets.getAgencyDashboard.url),
    (req, res) =>
      sendHttpResponse(req, res, async () => {
        const { dashboardUrl } =
          await deps.useCases.getUserAgencyDashboardUrl.execute(
            undefined,
            req.payloads?.inclusion,
          );
        if (!dashboardUrl)
          throw new ForbiddenError(
            `No dashboard found for user : ${req.payloads?.inclusion?.userId}`,
          );
        return dashboardUrl;
      }),
  );
  // end of stuffs to remove ---->>>

  inclusionConnectedRouter.post(
    removeRouterPrefix(
      inclusionConnectedAllowedTargets.registerAgenciesToUser.url,
    ),
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.registerAgencyToInclusionConnectUser.execute(
          req.body,
          req.payloads?.inclusion,
        ),
      ),
  );

  return [routerPrefix, inclusionConnectedRouter];
};

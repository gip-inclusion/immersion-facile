import { Router } from "express";
import { inclusionConnectedAllowedTargets } from "shared";
import { AppDependencies } from "../../config/createAppDependencies";
import {
  createRemoveRouterPrefix,
  RelativeUrl,
} from "../../createRemoveRouterPrefix";
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
    createInclusionConnectedMiddleware(deps.config.apiJwtPublicKey),
  );

  inclusionConnectedRouter.get(
    removeRouterPrefix(inclusionConnectedAllowedTargets.getAgencyDashboard.url),
    (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getUserAgencyDashboardUrl.execute(
          undefined,
          req.payloads?.inclusion,
        ),
      ),
  );

  return [routerPrefix, inclusionConnectedRouter];
};

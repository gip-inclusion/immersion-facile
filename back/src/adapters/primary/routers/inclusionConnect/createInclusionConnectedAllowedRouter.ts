import { Router } from "express";
import { inclusionConnectedAllowedTargets } from "shared";
import { AppDependencies } from "../../config/createAppDependencies";
import { createRemoveRouterPrefix } from "../../createRemoveRouterPrefix";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";
import { createInclusionConnectedMiddleware } from "./createInclusionConnectedMiddleware";

type RelativeUrl = `/${string}`;

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
      // eslint-disable-next-line @typescript-eslint/require-await
      sendHttpResponse(req, res, async () => {
        const success = `All good, userId is ${req.payloads?.inclusion?.userId}. TODO, get dashboard`;
        return { success };
      }),
  );

  return [routerPrefix, inclusionConnectedRouter];
};

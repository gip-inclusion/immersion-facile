import { Router } from "express";
import { inclusionConnectedAllowedTargets } from "shared";
import { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";
import { createInclusionConnectedMiddleware } from "./createInclusionConnectedMiddleware";

export const createInclusionConnectedAllowedRouter = (
  deps: AppDependencies,
): Router => {
  const inclusionConnectedRouter = Router({ mergeParams: true });

  inclusionConnectedRouter.get(
    inclusionConnectedAllowedTargets.getInclusionConnectedUser.url,
    createInclusionConnectedMiddleware(deps.config.jwtPublicKey),
    (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getUserAgencyDashboardUrl.execute(
          undefined,
          req.payloads?.inclusion,
        ),
      ),
  );

  inclusionConnectedRouter.post(
    inclusionConnectedAllowedTargets.registerAgenciesToUser.url,
    createInclusionConnectedMiddleware(deps.config.jwtPublicKey),
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.registerAgencyToInclusionConnectUser.execute(
          req.body,
          req.payloads?.inclusion,
        ),
      ),
  );

  return inclusionConnectedRouter;
};

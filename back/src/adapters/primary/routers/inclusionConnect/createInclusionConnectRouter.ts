import { Router } from "express";

import { inclusionConnectImmersionTargets } from "shared";

import { AppDependencies } from "../../config/createAppDependencies";
import { sendRedirectResponse } from "../../helpers/sendRedirectResponse";

export const createInclusionConnectRouter = (deps: AppDependencies) => {
  const inclusionConnectRouter = Router({ mergeParams: true });

  inclusionConnectRouter
    .route(inclusionConnectImmersionTargets.startInclusionConnectLogin.url)
    .get((req, res) =>
      sendRedirectResponse(req, res, () =>
        deps.useCases.initiateInclusionConnect.execute(),
      ),
    );

  inclusionConnectRouter
    .route(inclusionConnectImmersionTargets.afterLoginRedirection.url)
    .get(async (req, res) =>
      sendRedirectResponse(req, res, () =>
        deps.useCases.authenticateWithInclusionCode.execute(req.query as any),
      ),
    );

  return inclusionConnectRouter;
};

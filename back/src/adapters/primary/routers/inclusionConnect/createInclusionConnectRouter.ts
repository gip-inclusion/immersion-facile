import { Router } from "express";
import { inclusionConnectImmersionTargets } from "shared";
import { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";
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
      sendHttpResponse(req, res, async () =>
        deps.useCases.authenticateWithInclusionCode.execute(req.query as any),
      ),
    );

  return inclusionConnectRouter;
};

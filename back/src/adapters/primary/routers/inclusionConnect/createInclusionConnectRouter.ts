import { Router } from "express";
import { inclusionConnectImmersionRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";
import { sendRedirectResponse } from "../../../../config/helpers/sendRedirectResponse";

export const createInclusionConnectRouter = (deps: AppDependencies) => {
  const router = Router({ mergeParams: true });

  const inclusionConnectSharedRouter = createExpressSharedRouter(
    inclusionConnectImmersionRoutes,
    router,
  );

  inclusionConnectSharedRouter.startInclusionConnectLogin((req, res) =>
    sendRedirectResponse(req, res, () =>
      deps.useCases.initiateInclusionConnect.execute(req.query),
    ),
  );

  inclusionConnectSharedRouter.afterLoginRedirection(async (req, res) =>
    sendRedirectResponse(req, res, () =>
      deps.useCases.authenticateWithInclusionCode.execute(req.query),
    ),
  );

  inclusionConnectSharedRouter.initiateLoginByEmail(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.initiateLoginByEmail.execute(req.body),
    ),
  );

  return router;
};

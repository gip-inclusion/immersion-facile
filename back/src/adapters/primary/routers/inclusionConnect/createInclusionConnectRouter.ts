import { Router } from "express";
import {
  frontRoutes,
  inclusionConnectImmersionTargets,
  queryParamsAsString,
} from "shared";
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
      sendRedirectResponse(req, res, async () => {
        const token = await deps.useCases.authenticateWithInclusionCode.execute(
          req.query as any,
        );
        return `${deps.config.immersionFacileBaseUrl}/${
          frontRoutes.agencyDashboard
        }?${queryParamsAsString({ token })}`;
      }),
    );

  return inclusionConnectRouter;
};

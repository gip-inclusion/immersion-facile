import { Router } from "express";
import { loginPeConnect, peConnect } from "shared/src/routes";
import type { AppDependencies } from "../config/createAppDependencies";
import { FeatureDisabledError } from "../helpers/httpErrors";
import { sendRedirectResponse } from "../helpers/sendHttpResponse";

export const createPeConnectRouter = (deps: AppDependencies) => {
  const peConnectRouter = Router({ mergeParams: true });

  peConnectRouter.route(`/${loginPeConnect}`).get(async (req, res) =>
    sendRedirectResponse(req, res, async () => {
      await throwIfPeConnectDisabled(deps);
      return deps.repositories.peConnectGateway.oAuthGetAuthorizationCodeRedirectUrl();
    }),
  );

  peConnectRouter.route(`/${peConnect}`).get(async (req, res) =>
    sendRedirectResponse(req, res, async () => {
      await throwIfPeConnectDisabled(deps);
      return deps.useCases.linkPoleEmploiAdvisorAndRedirectToConvention.execute(
        req.query.code as string,
      );
    }),
  );

  return peConnectRouter;
};

const throwIfPeConnectDisabled = async (deps: AppDependencies) => {
  const features = await deps.repositories.getFeatureFlags();
  if (!features.enablePeConnectApi) {
    throw new FeatureDisabledError("PeConnect");
  }
};

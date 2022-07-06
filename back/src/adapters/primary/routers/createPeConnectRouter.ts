import { Router } from "express";
import { loginPeConnect, peConnect } from "shared/src/routes";
import type { AppDependencies } from "../config/createAppDependencies";
import { FeatureDisabledError } from "../helpers/httpErrors";
import { ManagedRedirectError } from "../helpers/redirectErrors";
import { sendRedirectResponse } from "../helpers/sendRedirectResponse";

export const createPeConnectRouter = (deps: AppDependencies) => {
  const peConnectRouter = Router({ mergeParams: true });

  peConnectRouter.route(`/${loginPeConnect}`).get(async (req, res) =>
    sendRedirectResponse(
      req,
      res,
      async () => {
        await throwIfPeConnectDisabled(deps);
        return deps.gateways.peConnectGateway.oAuthGetAuthorizationCodeRedirectUrl();
      },
      deps.errorHandlers.handleManagedRedirectResponseError,
      deps.errorHandlers.handleRawRedirectResponseError,
    ),
  );

  peConnectRouter.route(`/${peConnect}`).get(async (req, res) =>
    sendRedirectResponse(
      req,
      res,
      async () => {
        await throwIfPeConnectDisabled(deps);

        if (!req?.query?.code)
          throw new ManagedRedirectError("peConnectNoAuthorisation");

        return deps.useCases.linkPoleEmploiAdvisorAndRedirectToConvention.execute(
          req.query.code as string,
        );
      },
      deps.errorHandlers.handleManagedRedirectResponseError,
      deps.errorHandlers.handleRawRedirectResponseError,
    ),
  );

  return peConnectRouter;
};

const throwIfPeConnectDisabled = async (deps: AppDependencies) => {
  const features = await deps.useCases.getFeatureFlags();
  if (!features.enablePeConnectApi) {
    throw new FeatureDisabledError("PeConnect");
  }
};

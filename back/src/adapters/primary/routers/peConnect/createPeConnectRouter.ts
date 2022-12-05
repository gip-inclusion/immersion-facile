import { Router } from "express";
import { loginPeConnect, ManagedRedirectError, peConnect } from "shared";
import { makePeConnectLoginPageUrl } from "../../../secondary/PeConnectGateway/peConnectApi.client";
import { AppDependencies } from "../../config/createAppDependencies";
import { FeatureDisabledError } from "../../helpers/httpErrors";
import { sendRedirectResponseWithManagedErrors } from "../../helpers/sendRedirectResponseWithManagedErrors";

export const createPeConnectRouter = (deps: AppDependencies) => {
  const peConnectRouter = Router({ mergeParams: true });

  peConnectRouter.route(`/${loginPeConnect}`).get(async (req, res) =>
    sendRedirectResponseWithManagedErrors(
      req,
      res,
      async () => {
        await throwIfPeConnectDisabled(deps);
        return makePeConnectLoginPageUrl(deps.config);
      },
      deps.errorHandlers.handleManagedRedirectResponseError,
      deps.errorHandlers.handleRawRedirectResponseError,
    ),
  );

  peConnectRouter.route(`/${peConnect}`).get(async (req, res) =>
    sendRedirectResponseWithManagedErrors(
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
  const features = await deps.useCases.getFeatureFlags.execute();
  if (!features.enablePeConnectApi) {
    throw new FeatureDisabledError("PeConnect");
  }
};

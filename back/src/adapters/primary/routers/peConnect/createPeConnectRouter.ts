import { Router } from "express";
import { ManagedRedirectError, loginPeConnect, peConnect } from "shared";
import { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendRedirectResponseWithManagedErrors } from "../../../../config/helpers/sendRedirectResponseWithManagedErrors";
import { makePeConnectLoginPageUrl } from "../../../../domains/core/authentication/ft-connect/adapters/ft-connect-gateway/ftConnectApi.routes";

export const createPeConnectRouter = (deps: AppDependencies) => {
  const peConnectRouter = Router({ mergeParams: true });

  peConnectRouter.route(`/${loginPeConnect}`).get(async (req, res) =>
    sendRedirectResponseWithManagedErrors(
      req,
      res,

      async () => makePeConnectLoginPageUrl(deps.config),
      deps.errorHandlers.handleManagedRedirectResponseError,
      deps.errorHandlers.handleRawRedirectResponseError,
    ),
  );

  peConnectRouter.route(`/${peConnect}`).get(async (req, res) =>
    sendRedirectResponseWithManagedErrors(
      req,
      res,
      async () => {
        if (!req?.query?.code)
          throw new ManagedRedirectError("peConnectNoAuthorisation");

        return deps.useCases.linkFranceTravailAdvisorAndRedirectToConvention.execute(
          req.query.code as string,
        );
      },
      deps.errorHandlers.handleManagedRedirectResponseError,
      deps.errorHandlers.handleRawRedirectResponseError,
    ),
  );

  return peConnectRouter;
};

import { Router } from "express";
import { ManagedRedirectError, loginPeConnect, peConnect } from "shared";
import { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendRedirectResponseWithManagedErrors } from "../../../../config/helpers/sendRedirectResponseWithManagedErrors";
import { makePeConnectLoginPageUrl } from "../../../../domains/core/authentication/pe-connect/adapters/pe-connect-gateway/peConnectApi.routes";

export const createPeConnectRouter = (deps: AppDependencies) => {
  const peConnectRouter = Router({ mergeParams: true });

  peConnectRouter.route(`/${loginPeConnect}`).get(async (req, res) =>
    sendRedirectResponseWithManagedErrors(
      req,
      res,
      // eslint-disable-next-line @typescript-eslint/require-await
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

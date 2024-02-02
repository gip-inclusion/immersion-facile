import { Router } from "express";
import { ManagedRedirectError, loginPeConnect, peConnect } from "shared";
import { makePeConnectLoginPageUrl } from "../../../secondary/PeConnectGateway/peConnectApi.routes";
import { AppDependencies } from "../../config/createAppDependencies";
import { sendRedirectResponseWithManagedErrors } from "../../helpers/sendRedirectResponseWithManagedErrors";

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

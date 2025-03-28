import { Router } from "express";
import { errors, ftConnect, loginFtConnect } from "shared";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendRedirectResponseWithManagedErrors } from "../../../../config/helpers/sendRedirectResponseWithManagedErrors";
import { makeFtConnectLoginPageUrl } from "../../../../domains/core/authentication/ft-connect/adapters/ft-connect-gateway/ftConnectApi.routes";

export const createFtConnectRouter = (deps: AppDependencies) => {
  const ftConnectRouter = Router({ mergeParams: true });

  ftConnectRouter.route(`/${loginFtConnect}`).get(async (req, res) =>
    sendRedirectResponseWithManagedErrors(
      req,
      res,

      async () => makeFtConnectLoginPageUrl(deps.config),
      deps.errorHandlers.handleManagedRedirectResponseError,
      deps.errorHandlers.handleRawRedirectResponseError,
    ),
  );

  ftConnectRouter.route(`/${ftConnect}`).get(async (req, res) =>
    sendRedirectResponseWithManagedErrors(
      req,
      res,
      async () => {
        if (!req?.query?.code) throw errors.ftConnect.noAuth();

        return deps.useCases.linkFranceTravailAdvisorAndRedirectToConvention.execute(
          req.query.code as string,
        );
      },
      deps.errorHandlers.handleManagedRedirectResponseError,
      deps.errorHandlers.handleRawRedirectResponseError,
    ),
  );

  return ftConnectRouter;
};

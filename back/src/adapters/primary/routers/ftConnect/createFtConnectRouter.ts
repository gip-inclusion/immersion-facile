import { Router } from "express";
import { errors, ftConnect } from "shared";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendRedirectResponseWithManagedErrors } from "../../../../config/helpers/sendRedirectResponseWithManagedErrors";

export const createFtConnectRouter = (deps: AppDependencies) => {
  const ftConnectRouter = Router({ mergeParams: true });

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

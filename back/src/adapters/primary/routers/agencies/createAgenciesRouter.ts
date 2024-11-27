import { Router } from "express";
import { agencyRoutes, errors } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";

export const createAgenciesRouter = (deps: AppDependencies) => {
  const expressRouter = Router();

  const sharedAgencyRouter = createExpressSharedRouter(
    agencyRoutes,
    expressRouter,
  );

  sharedAgencyRouter.getAgencyOptionsByFilter((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.listAgencyOptionsByFilter.execute(req.query),
    ),
  );

  sharedAgencyRouter.addAgency((req, res) =>
    sendHttpResponse(req, res, () => deps.useCases.addAgency.execute(req.body)),
  );

  sharedAgencyRouter.getImmersionFacileAgencyId((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getImmersionFacileAgencyIdByKind.execute(),
    ),
  );

  sharedAgencyRouter.getAgencyPublicInfoById((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getAgencyPublicInfoById.execute(req.query),
    ),
  );

  sharedAgencyRouter.updateUserRoleForAgency(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.updateUserForAgency.execute(
          req.body,
          req.payloads?.currentUser,
        ),
      ),
  );
  sharedAgencyRouter.getAgencyByIdForDashboard(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        const currentUser = req.payloads?.currentUser;
        if (!currentUser) throw errors.user.unauthorized();
        return deps.useCases.getAgencyByIdForDashboard.execute(
          req.params.agencyId,
          currentUser,
        );
      }),
  );

  sharedAgencyRouter.getAgencyUsersByAgencyIdForDashboard(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        const currentUser = req.payloads?.currentUser;
        if (!currentUser) throw errors.user.unauthorized();
        return deps.useCases.getIcUsers.execute(
          { agencyId: req.params.agencyId },
          currentUser,
        );
      }),
  );

  sharedAgencyRouter.updateAgencyFromDashboard(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.updateAgency.execute(req.body, req.payloads?.currentUser),
      ),
  );

  return expressRouter;
};

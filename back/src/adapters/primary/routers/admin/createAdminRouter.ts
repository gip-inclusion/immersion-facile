import { Router } from "express";
import { adminRoutes, agencyRoutes, GetDashboardParams } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../config/createAppDependencies";
import { BadRequestError } from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createAdminRouter = (deps: AppDependencies): Router => {
  const expressRouter = Router({ mergeParams: true });

  const sharedAdminRouter = createExpressSharedRouter(
    adminRoutes,
    expressRouter,
  );

  const sharedAgencyRouter = createExpressSharedRouter(
    agencyRoutes,
    expressRouter,
  );

  sharedAdminRouter.login((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.adminLogin.execute(req.body),
    ),
  );

  sharedAdminRouter.getDashboardUrl(deps.adminAuthMiddleware, (req, res) =>
    sendHttpResponse(req, res, () => {
      if (req.params.dashboardName === "agency" && !req.query.agencyId)
        throw new BadRequestError(
          "You need to provide agency Id in query params : http://.../agency?agencyId=your-id",
        );
      const useCaseParams: GetDashboardParams = {
        name: req.params.dashboardName as any,
        ...(req.query.agencyId ? req.query : {}),
      };

      return deps.useCases.getDashboard.execute(useCaseParams);
    }),
  );

  sharedAdminRouter.getLastNotifications(deps.adminAuthMiddleware, (req, res) =>
    sendHttpResponse(req, res, deps.useCases.getLastNotifications.execute),
  );

  sharedAdminRouter.updateFeatureFlags(deps.adminAuthMiddleware, (req, res) =>
    sendHttpResponse(req, res.status(201), () =>
      deps.useCases.setFeatureFlag.execute(req.body),
    ),
  );

  sharedAdminRouter.addFormEstablishmentBatch(
    deps.adminAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addFormEstablishmentBatch.execute(req.body),
      ),
  );

  sharedAdminRouter.getInclusionConnectedUsers(
    deps.adminAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getIcUsers.execute(req.query, req.payloads?.backOffice),
      ),
  );

  sharedAdminRouter.updateUserRoleForAgency(
    deps.adminAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(201), () =>
        deps.useCases.updateIcUserRoleForAgency.execute(
          req.body,
          req.payloads?.backOffice,
        ),
      ),
  );

  sharedAdminRouter.rejectIcUserForAgency(
    deps.adminAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(201), () =>
        deps.useCases.rejectIcUserForAgency.execute(
          req.body,
          req.payloads?.backOffice,
        ),
      ),
  );

  sharedAdminRouter.saveApiConsumer(deps.adminAuthMiddleware, (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.saveApiConsumer.execute(req.body, req.payloads?.backOffice),
    ),
  );

  sharedAdminRouter.getAllApiConsumers(deps.adminAuthMiddleware, (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getAllApiConsumers.execute({}),
    ),
  );

  sharedAgencyRouter.getAgencyAdminById(deps.adminAuthMiddleware, (req, res) =>
    sendHttpResponse(req, res, async () =>
      deps.useCases.getAgencyById.execute(req.params.agencyId),
    ),
  );

  sharedAgencyRouter.updateAgencyStatus(deps.adminAuthMiddleware, (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.updateAgencyStatus.execute(req.body),
    ),
  );

  sharedAgencyRouter.updateAgency(deps.adminAuthMiddleware, (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.updateAgencyAdmin.execute(req.body),
    ),
  );

  sharedAgencyRouter.listAgenciesWithStatus(
    deps.adminAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.privateListAgencies.execute(req.query),
      ),
  );

  return expressRouter;
};

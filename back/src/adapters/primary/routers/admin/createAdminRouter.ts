import { Router } from "express";
import {
  AdminDashboardKind,
  adminDashboardKinds,
  adminRoutes,
  agencyRoutes,
  ConventionMagicLinkDashboardName,
  conventionMagicLinkDashboardNames,
  GetDashboardParams,
} from "shared";
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

  // should keep login route above middleware
  expressRouter.use("/admin", deps.adminAuthMiddleware);

  sharedAdminRouter.getDashboardUrl((req, res) =>
    sendHttpResponse(req, res, () => {
      if (
        !adminDashboardKinds.includes(
          req.params.dashboardName as AdminDashboardKind,
        ) &&
        !conventionMagicLinkDashboardNames.includes(
          req.params.dashboardName as ConventionMagicLinkDashboardName,
        )
      ) {
        throw new BadRequestError("Incorrect dashboard name");
      }
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

  sharedAdminRouter.getLastNotifications((req, res) =>
    sendHttpResponse(req, res, deps.useCases.getLastNotifications.execute),
  );

  sharedAdminRouter.updateFeatureFlags((req, res) =>
    sendHttpResponse(req, res.status(201), () =>
      deps.useCases.setFeatureFlag.execute(req.body),
    ),
  );

  sharedAdminRouter.addFormEstablishmentBatch((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.addFormEstablishmentBatch.execute(req.body),
    ),
  );

  sharedAdminRouter.getInclusionConnectedUsers((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getIcUsers.execute(req.query, req.payloads?.backOffice),
    ),
  );

  sharedAdminRouter.updateUserRoleForAgency((req, res) =>
    sendHttpResponse(req, res.status(201), () =>
      deps.useCases.updateIcUserRoleForAgency.execute(
        req.body,
        req.payloads?.backOffice,
      ),
    ),
  );

  sharedAdminRouter.saveApiConsumer((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.saveApiConsumer.execute(req.body, req.payloads?.backOffice),
    ),
  );

  sharedAdminRouter.getAllApiConsumers((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getAllApiConsumers.execute({}),
    ),
  );

  sharedAgencyRouter.getAgencyAdminById((req, res) =>
    sendHttpResponse(req, res, async () =>
      deps.useCases.getAgencyById.execute(req.params.agencyId),
    ),
  );

  sharedAgencyRouter.updateAgencyStatus((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.updateAgencyStatus.execute({
        id: req.params.agencyId,
        ...req.body,
      }),
    ),
  );

  sharedAgencyRouter.updateAgency((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.updateAgencyAdmin.execute(req.body),
    ),
  );

  sharedAgencyRouter.listAgenciesWithStatus((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.privateListAgencies.execute(req.query),
    ),
  );

  return expressRouter;
};

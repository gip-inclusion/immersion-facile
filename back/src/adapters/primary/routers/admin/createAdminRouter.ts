import { Router } from "express";
import {
  adminRoutes,
  AgencyDto,
  AgencyId,
  agencyTargets,
  GetDashboardParams,
} from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../config/createAppDependencies";
import { BadRequestError } from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createAdminRouter = (deps: AppDependencies): Router => {
  const adminExpressRouter = Router({ mergeParams: true });

  const sharedAdminRouter = createExpressSharedRouter(
    adminRoutes,
    adminExpressRouter,
  );

  sharedAdminRouter.login((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.adminLogin.execute(req.body),
    ),
  );

  // const { removeRouterPrefix, routerPrefix } =
  //   createRemoveRouterPrefix("/admin");

  // adminRouter
  //   .route(removeRouterPrefix(adminRoutes.login.url))
  //   .post(async (req, res) =>
  //     sendHttpResponse(req, res, () =>
  //       deps.useCases.adminLogin.execute(req.body),
  //     ),
  //   );

  adminExpressRouter.use("/admin", deps.adminAuthMiddleware);

  adminExpressRouter
    .route(agencyTargets.getAgencyAdminById.url)
    .get((req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getAgencyById.execute(req.params.agencyId),
      ),
    );

  adminExpressRouter
    .route(agencyTargets.updateAgencyStatus.url)
    .patch(async (req, res) =>
      sendHttpResponse(req, res, () => {
        const useCaseParams: Partial<Pick<AgencyDto, "status">> & {
          id: AgencyId;
        } = { id: req.params.agencyId, ...req.body };
        return deps.useCases.updateAgencyStatus.execute(useCaseParams);
      }),
    );

  adminExpressRouter
    .route(agencyTargets.updateAgency.url)
    .put(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.updateAgencyAdmin.execute(req.body),
      ),
    );

  adminExpressRouter
    .route(agencyTargets.listAgenciesWithStatus.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.privateListAgencies.execute(req.query),
      ),
    );

  sharedAdminRouter.getDashboardUrl((req, res) =>
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
      deps.useCases.getIcUsers.execute(
        req.query as any,
        req.payloads?.backOffice,
      ),
    ),
  );

  sharedAdminRouter.updateUserRoleForAgency((req, res) =>
    sendHttpResponse(req, res.status(201), () =>
      deps.useCases.updateIcUserRoleForAgency.execute(
        req.body as any,
        req.payloads?.backOffice,
      ),
    ),
  );

  return adminExpressRouter;
};

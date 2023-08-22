import { Router } from "express";
import {
  adminLogin,
  adminTargets,
  AgencyDto,
  AgencyId,
  agencyTargets,
  GetDashboardParams,
} from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import {
  createRemoveRouterPrefix,
  RelativeUrl,
} from "../../createRemoveRouterPrefix";
import { BadRequestError } from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createAdminRouter = (
  deps: AppDependencies,
): [RelativeUrl, Router] => {
  const adminRouter = Router({ mergeParams: true });

  adminRouter
    .route(`/${adminLogin}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.adminLogin.execute(req.body),
      ),
    );

  adminRouter.use(deps.adminAuthMiddleware);

  const { removeRouterPrefix, routerPrefix } =
    createRemoveRouterPrefix("/admin");

  adminRouter
    .route(removeRouterPrefix(agencyTargets.getAgencyAdminById.url))
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getAgencyById.execute(req.params.agencyId),
      ),
    );

  adminRouter
    .route(removeRouterPrefix(agencyTargets.updateAgencyStatus.url))
    .patch(async (req, res) =>
      sendHttpResponse(req, res, () => {
        const useCaseParams: Partial<Pick<AgencyDto, "status">> & {
          id: AgencyId;
        } = { id: req.params.agencyId, ...req.body };
        return deps.useCases.updateAgencyStatus.execute(useCaseParams);
      }),
    );

  adminRouter
    .route(removeRouterPrefix(agencyTargets.updateAgency.url))
    .put(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.updateAgencyAdmin.execute(req.body),
      ),
    );

  adminRouter
    .route(removeRouterPrefix(agencyTargets.listAgenciesWithStatus.url))
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.privateListAgencies.execute(req.query),
      ),
    );

  adminRouter
    .route(removeRouterPrefix(adminTargets.getDashboardUrl.url))
    .get(async (req, res) =>
      sendHttpResponse(req, res, () => {
        if (req.params.dashboardName === "agency" && !req.query.agencyId)
          throw new BadRequestError(
            "You need to provide agency Id in query params : http://.../agency?agencyId=your-id",
          );
        const useCaseParams: GetDashboardParams = {
          name: req.params.dashboardName as any,
          ...((req.query.agencyId as string | undefined) ? req.query : {}),
        };

        return deps.useCases.getDashboard.execute(useCaseParams);
      }),
    );

  adminRouter
    .route(removeRouterPrefix(adminTargets.getLastNotifications.url))
    .get((req, res) =>
      sendHttpResponse(req, res, deps.useCases.getLastNotifications.execute),
    );

  adminRouter
    .route(removeRouterPrefix(adminTargets.updateFeatureFlags.url))
    .post((req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.setFeatureFlag.execute(req.body),
      ),
    );

  adminRouter
    .route(removeRouterPrefix(adminTargets.addFormEstablishmentBatch.url))
    .post((req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addFormEstablishmentBatch.execute(req.body),
      ),
    );

  adminRouter
    .route(removeRouterPrefix(adminTargets.getInclusionConnectedUsers.url))
    .get((req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getIcUsers.execute(
          req.query as any,
          req.payloads?.backOffice,
        ),
      ),
    );

  adminRouter
    .route(removeRouterPrefix(adminTargets.updateUserRoleForAgency.url))
    .patch((req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.updateIcUserRoleForAgency.execute(
          req.body as any,
          req.payloads?.backOffice,
        ),
      ),
    );

  return [routerPrefix, adminRouter];
};

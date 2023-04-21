import { Router } from "express";
import {
  adminLogin,
  adminTargets,
  AgencyDto,
  AgencyId,
  agencyTargets,
  conventionsRoute,
  emailRoute,
  ExportDataDto,
  exportRoute,
  featureFlagsRoute,
  generateMagicLinkRoute,
  GetDashboardParams,
} from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import {
  createRemoveRouterPrefix,
  RelativeUrl,
} from "../../createRemoveRouterPrefix";
import { BadRequestError } from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";
import { sendZipResponse } from "../../helpers/sendZipResponse";

export const createAdminRouter = (
  deps: AppDependencies,
): [RelativeUrl, Router] => {
  const adminRouter = Router({ mergeParams: true });
  const { removeRouterPrefix, routerPrefix } =
    createRemoveRouterPrefix("/admin");

  adminRouter
    .route(`/${adminLogin}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.adminLogin.execute(req.body),
      ),
    );

  adminRouter.use(deps.adminAuthMiddleware);

  adminRouter.route(`/${generateMagicLinkRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.generateMagicLink.execute({
        applicationId: req.query.id,
        role: req.query.role,
        expired: req.query.expired === "true",
      } as any),
    ),
  );

  adminRouter
    .route(`/${conventionsRoute}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getConvention.execute(req.params),
      ),
    );

  // GET,
  // PATCH Update on status to activate
  // PUT Full update following admin edit
  // admin/agencies/:id
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

  // GET admin/agencies?status=needsReview
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

  // GET admin/emails
  adminRouter
    .route(`/${emailRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, deps.useCases.getSentEmails.execute),
    );

  adminRouter.route(`/${exportRoute}`).post(async (req, res) =>
    sendZipResponse(req, res, async () => {
      const exportDataParams: ExportDataDto = req.body;
      const archivePath = await deps.useCases.exportData.execute(
        exportDataParams,
      );
      return archivePath;
    }),
  );

  // POST admin/feature-flags
  adminRouter
    .route(`/${featureFlagsRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.setFeatureFlag.execute(req.body),
      ),
    );

  //Establishment
  adminRouter
    .route(removeRouterPrefix(adminTargets.addFormEstablishmentBatch.url))
    .post(async (req, res) =>
      // eslint-disable-next-line @typescript-eslint/require-await
      sendHttpResponse(req, res, async () =>
        deps.useCases.addFormEstablishmentBatch.execute(req.body),
      ),
    );

  adminRouter
    .route(removeRouterPrefix(adminTargets.getInclusionConnectedUsers.url))
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getIcUsers.execute(
          req.query as any,
          req.payloads?.backOffice,
        ),
      ),
    );

  adminRouter
    .route(removeRouterPrefix(adminTargets.updateUserRoleForAgency.url))
    .patch(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.updateIcUserRoleForAgency.execute(
          req.body as any,
          req.payloads?.backOffice,
        ),
      ),
    );

  return [routerPrefix, adminRouter];
};

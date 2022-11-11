import { Router } from "express";
import {
  adminLogin,
  adminTargets,
  agenciesRoute,
  AgencyDto,
  AgencyId,
  conventionsRoute,
  emailRoute,
  ExportDataDto,
  exportRoute,
  featureFlagsRoute,
  generateMagicLinkRoute,
  GetDashboardParams,
} from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import { BadRequestError } from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";
import { sendZipResponse } from "../../helpers/sendZipResponse";

type RelativeUrl = `/${string}`;
type RemovePrefix<
  U extends string,
  Prefix extends string,
> = U extends `${Prefix}/${infer V}` ? `/${V}` : never;

const routerPrefix = "/admin";

const removeRouterPrefix = <U extends RelativeUrl>(
  url: U,
): RemovePrefix<U, typeof routerPrefix> =>
  url.replace(routerPrefix, "") as RemovePrefix<U, typeof routerPrefix>;

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
    .route(`/${agenciesRoute}/:agencyId`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getAgencyById.execute(req.params.agencyId),
      ),
    )
    .patch(async (req, res) =>
      sendHttpResponse(req, res, () => {
        const useCaseParams: Partial<Pick<AgencyDto, "status">> & {
          id: AgencyId;
        } = { id: req.params.agencyId, ...req.body };
        return deps.useCases.updateAgencyStatus.execute(useCaseParams);
      }),
    )
    .put(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.updateAgencyAdmin.execute(req.body),
      ),
    );

  // GET admin/agencies?status=needsReview
  adminRouter
    .route(`/${agenciesRoute}`)
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
          ...((req.query.agencyId as string | undefined)
            ? { agencyId: req.query.agencyId }
            : {}),
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

  return [routerPrefix, adminRouter];
};

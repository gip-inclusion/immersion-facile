import { Router } from "express";
import { AgencyDto, AgencyId } from "shared/src/agency/agency.dto";
import {
  generateMagicLinkRoute,
  conventionsRoute,
  agenciesRoute,
  adminLogin,
} from "shared/src/routes";
import type { AppDependencies } from "../config/createAppDependencies";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

export const createAdminRouter = (deps: AppDependencies) => {
  const adminRouter = Router({ mergeParams: true });

  adminRouter
    .route(`/${adminLogin}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.adminLogin.execute(req.body),
      ),
    );

  adminRouter
    .route(`/${conventionsRoute}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(
        req,
        res,
        () => deps.useCases.getConvention.execute(req.params),
        deps.authChecker,
      ),
    );

  adminRouter.route(`/${generateMagicLinkRoute}`).get(async (req, res) =>
    sendHttpResponse(
      req,
      res,
      () =>
        deps.useCases.generateMagicLink.execute({
          applicationId: req.query.id,
          role: req.query.role,
          expired: req.query.expired === "true",
        } as any),
      deps.authChecker,
    ),
  );
  // GET admin/agencies?status=needsReview
  adminRouter
    .route(`/${agenciesRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(
        req,
        res,
        () => deps.useCases.privateListAgencies.execute(req.query),
        deps.authChecker,
      ),
    );

  // PATCH admin/agencies/:id
  adminRouter.route(`/${agenciesRoute}/:agencyId`).patch(async (req, res) =>
    sendHttpResponse(
      req,
      res,
      () => {
        const useCaseParams: Partial<Pick<AgencyDto, "status">> & {
          id: AgencyId;
        } = { id: req.params.agencyId, ...req.body };
        return deps.useCases.updateAgency.execute(useCaseParams);
      },
      deps.authChecker,
    ),
  );

  return adminRouter;
};

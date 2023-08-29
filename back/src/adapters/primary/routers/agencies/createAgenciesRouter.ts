import { Router } from "express";
import { agencyRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createAgenciesRouter = (deps: AppDependencies) => {
  const expressRouter = Router();

  const sharedAgencyRouter = createExpressSharedRouter(
    agencyRoutes,
    expressRouter,
  );

  sharedAgencyRouter.getFilteredAgencies((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.listAgenciesByFilter.execute(req.query),
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

  return expressRouter;
};

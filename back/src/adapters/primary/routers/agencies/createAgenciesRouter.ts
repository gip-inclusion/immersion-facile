import { Router } from "express";
import { agencyTargets } from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createAgenciesRouter = (deps: AppDependencies) => {
  const agenciesRouter = Router();

  agenciesRouter
    .route(agencyTargets.getFilteredAgencies.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.listAgenciesByFilter.execute(req.query as any),
      ),
    );

  agenciesRouter
    .route(agencyTargets.addAgency.url)
    .post(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.addAgency.execute(req.body),
      ),
    );

  agenciesRouter
    .route(agencyTargets.getImmersionFacileAgencyId.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getImmersionFacileAgencyIdByKind.execute(),
      ),
    );

  agenciesRouter
    .route(agencyTargets.getAgencyPublicInfoById.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getAgencyPublicInfoById.execute({
          agencyId: req.query.id as string,
        }),
      ),
    );

  return agenciesRouter;
};

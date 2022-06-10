import { Router } from "express";
import {
  agenciesRoute,
  agencyPublicInfoByIdRoute,
  agencyImmersionFacileIdRoute,
} from "shared/src/routes";
import type { AppDependencies } from "../config/createAppDependencies";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

export const createAgenciesRouter = (deps: AppDependencies) => {
  const agenciesRouter = Router();

  agenciesRouter
    .route(`/${agenciesRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.listAgencies.execute(req.query as any),
      ),
    )
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addAgency.execute(req.body),
      ),
    );

  agenciesRouter
    .route(`/${agencyImmersionFacileIdRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.repositories.agency.getImmersionFacileIdByKind(),
      ),
    );

  agenciesRouter.route(`/${agencyPublicInfoByIdRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, async () =>
      deps.useCases.getAgencyPublicInfoById.execute({
        id: req.query.id as string,
      }),
    ),
  );

  return agenciesRouter;
};

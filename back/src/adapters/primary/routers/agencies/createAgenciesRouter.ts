import { Router } from "express";
import {
  agenciesRoute,
  agencyImmersionFacileIdRoute,
  agencyPublicInfoByIdRoute,
} from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createAgenciesRouter = (deps: AppDependencies) => {
  const agenciesRouter = Router();

  agenciesRouter
    .route(`/${agenciesRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.listAgenciesByFilter.execute(req.query as any),
      ),
    )
    .post(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.addAgency.execute(req.body),
      ),
    );

  agenciesRouter
    .route(`/${agencyImmersionFacileIdRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getImmersionFacileAgencyIdByKind.execute(),
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

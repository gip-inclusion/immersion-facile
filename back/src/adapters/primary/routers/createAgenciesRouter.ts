import { Router } from "express";
import { ListAgenciesRequestDto } from "shared/src/agency/agency.dto";
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
      sendHttpResponse(req, res, async () => {
        const query: ListAgenciesRequestDto = req.query;
        return deps.useCases.listAgencies.execute({
          position: {
            lat: parseFloat(query.position?.lat as any),
            lon: parseFloat(query.position?.lon as any),
          } as any,
          filter: query.filter,
        });
      }),
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

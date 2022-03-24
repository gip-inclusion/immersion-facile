import { Router } from "express";
import { agenciesRoute } from "../../../shared/routes";
import { AppDependencies } from "../config";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

export const createAgenciesRouter = (deps: AppDependencies) => {
  const agenciesRouter = Router();

  agenciesRouter
    .route(`/${agenciesRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.listAgencies.execute({
          position: {
            lat: parseFloat(req.query.lat as any),
            lon: parseFloat(req.query.lon as any),
          } as any,
        }),
      ),
    )
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addAgency.execute(req.body),
      ),
    );

  return agenciesRouter;
};

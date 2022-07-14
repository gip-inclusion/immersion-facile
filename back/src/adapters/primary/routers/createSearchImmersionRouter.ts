import { Router } from "express";
import { immersionOffersRoute } from "shared/src/routes";
import type { AppDependencies } from "../config/createAppDependencies";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

export const createSearchImmersionRouter = (deps: AppDependencies) => {
  const searchImmersionRouter = Router();

  searchImmersionRouter
    .route(`/${immersionOffersRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () => {
        await deps.useCases.callLaBonneBoiteAndUpdateRepositories.execute(
          req.query as any,
        );
        return deps.useCases.searchImmersion.execute(
          req.query as any,
          req.apiConsumer,
        );
      }),
    );
  return searchImmersionRouter;
};

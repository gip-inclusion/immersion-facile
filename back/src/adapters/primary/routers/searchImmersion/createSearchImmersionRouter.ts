import { Router } from "express";
import { searchResultsTargets } from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createSearchImmersionRouter = (deps: AppDependencies) => {
  const searchImmersionRouter = Router();

  searchImmersionRouter
    .route(searchResultsTargets.searchImmersion.url)
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

  searchImmersionRouter
    .route(searchResultsTargets.contactEstablishment.url)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.contactEstablishment.execute(req.body),
      ),
    );

  searchImmersionRouter
    .route(searchResultsTargets.getOffersByGroupSlug.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getOffersByGroupSlug.execute(req.params),
      ),
    );

  return searchImmersionRouter;
};

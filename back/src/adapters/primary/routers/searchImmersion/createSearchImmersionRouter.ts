import { Router } from "express";
import { searchTargets } from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createSearchImmersionRouter = (deps: AppDependencies) => {
  const searchImmersionRouter = Router();

  searchImmersionRouter
    .route(searchTargets.searchImmersion.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () => {
        const query =
          await deps.useCases.convertSearchimmersionQueryParamsToSearchImmerssionParamsDto.execute(
            req.query as any,
          );

        return deps.useCases.searchImmersion.execute(query, req.apiConsumer);
      }),
    );

  searchImmersionRouter
    .route(searchTargets.contactEstablishment.url)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.contactEstablishment.execute(req.body),
      ),
    );

  searchImmersionRouter
    .route(searchTargets.getOffersByGroupSlug.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getOffersByGroupSlug.execute(req.params),
      ),
    );

  return searchImmersionRouter;
};

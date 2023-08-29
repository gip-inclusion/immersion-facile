import { Router } from "express";
import { searchImmersionRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createSearchRouter = (deps: AppDependencies) => {
  const searchImmersionRouter = Router();

  const expressSharedRouter = createExpressSharedRouter(
    searchImmersionRoutes,
    searchImmersionRouter,
  );

  expressSharedRouter.search(async (req, res) =>
    sendHttpResponse(req, res, async () =>
      deps.useCases.searchImmersion.execute(req.query, req.apiConsumer),
    ),
  );

  expressSharedRouter.contactEstablishment(async (req, res) =>
    sendHttpResponse(req, res.status(201), () =>
      deps.useCases.contactEstablishment.execute(req.body),
    ),
  );

  expressSharedRouter.getOffersByGroupSlug(async (req, res) =>
    sendHttpResponse(req, res, async () =>
      deps.useCases.getOffersByGroupSlug.execute(req.params),
    ),
  );

  expressSharedRouter.getSearchResult(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getSearchResultBySiretAndAppellationCode.execute(req.query),
    ),
  );

  return searchImmersionRouter;
};

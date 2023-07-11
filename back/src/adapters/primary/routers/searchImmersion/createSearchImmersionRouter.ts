import { Router } from "express";
import { searchTargets } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createSearchImmersionRouter = (deps: AppDependencies) => {
  const searchImmersionRouter = Router();

  const expressSharedRouter = createExpressSharedRouter(
    searchTargets,
    searchImmersionRouter,
  );

  expressSharedRouter.searchImmersion(async (req, res) =>
    sendHttpResponse(req, res, async () => {
      const query =
        await deps.useCases.convertSearchImmersionQueryParamsToSearchImmersionParamsDto.execute(
          req.query as any,
        );

      return deps.useCases.searchImmersion.execute(query, req.apiConsumer);
    }),
  );

  expressSharedRouter.contactEstablishment(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.contactEstablishment.execute(req.body),
    ),
  );

  expressSharedRouter.getOffersByGroupSlug(async (req, res) =>
    sendHttpResponse(req, res, async () =>
      deps.useCases.getOffersByGroupSlug.execute(req.params),
    ),
  );

  return searchImmersionRouter;
};

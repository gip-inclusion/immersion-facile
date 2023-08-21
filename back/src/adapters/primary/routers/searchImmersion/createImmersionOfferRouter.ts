import { Router } from "express";
import { immersionOfferTargets } from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createImmersionOfferRouter = (deps: AppDependencies) => {
  const immersionOfferRouter = Router();

  immersionOfferRouter
    .route(immersionOfferTargets.getImmersionOffer.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getSearchImmersionResultBySiretAndAppellationCode.execute(
          req.query as any,
        ),
      ),
    );

  return immersionOfferRouter;
};

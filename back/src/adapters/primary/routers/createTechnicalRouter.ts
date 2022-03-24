import { Router } from "express";
import { getFeatureFlags, renewMagicLinkRoute } from "../../../shared/routes";
import { AppDependencies } from "../config";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

export const createTechnicalRouter = (deps: AppDependencies) => {
  const technicalRouter = Router();
  technicalRouter.route(`/${renewMagicLinkRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.renewMagicLink.execute({
        expiredJwt: req.query.expiredJwt,
        linkFormat: req.query.linkFormat,
      } as any),
    ),
  );

  technicalRouter
    .route(`/${getFeatureFlags}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, deps.repositories.getFeatureFlags),
    );

  return technicalRouter;
};

import { Router } from "express";
import { unauthenticatedConventionTargets } from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createConventionRouter = (deps: AppDependencies) => {
  const conventionRouter = Router();

  conventionRouter
    .route(unauthenticatedConventionTargets.shareConvention.url)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.shareConventionByEmail.execute(req.body),
      ),
    );

  conventionRouter
    .route(unauthenticatedConventionTargets.createConvention.url)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addConvention.execute(req.body),
      ),
    );

  return conventionRouter;
};

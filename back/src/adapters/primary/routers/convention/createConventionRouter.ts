import { Router } from "express";
import { unauthenticatedConventionRoutes } from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createConventionRouter = (deps: AppDependencies) => {
  const conventionRouter = Router();

  conventionRouter
    .route(unauthenticatedConventionRoutes.shareConvention.url)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.shareConventionByEmail.execute(req.body),
      ),
    );

  conventionRouter
    .route(unauthenticatedConventionRoutes.createConvention.url)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addConvention.execute(req.body),
      ),
    );

  return conventionRouter;
};

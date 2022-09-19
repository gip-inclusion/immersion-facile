import { Router } from "express";
import { conventionShareRoute, conventionsRoute } from "shared/src/routes";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createConventionRouter = (deps: AppDependencies) => {
  const conventionRouter = Router();

  conventionRouter
    .route(`/${conventionShareRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.shareConventionByEmail.execute(req.body),
      ),
    );

  conventionRouter
    .route(`/${conventionsRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addConvention.execute(req.body),
      ),
    );

  return conventionRouter;
};

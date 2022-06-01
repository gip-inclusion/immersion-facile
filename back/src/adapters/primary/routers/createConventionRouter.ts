import { Router } from "express";
import {
  conventionShareRoute,
  conventionsRoute,
  validateConventionRoute,
} from "shared/src/routes";
import type { AppDependencies } from "../config/createAppDependencies";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

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
    )
    .get(async (req, res) =>
      sendHttpResponse(
        req,
        res,
        () => deps.useCases.listConventions.execute(req.query),
        deps.authChecker,
      ),
    );

  conventionRouter
    .route(`/${validateConventionRoute}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(
        req,
        res,
        () => deps.useCases.validateConvention.execute(req.params.id),
        deps.authChecker,
      ),
    );

  return conventionRouter;
};

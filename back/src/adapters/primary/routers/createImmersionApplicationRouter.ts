import { Router } from "express";
import {
  immersionApplicationShareRoute,
  immersionApplicationsRoute,
  validateImmersionApplicationRoute,
} from "../../../shared/routes";
import { AppDependencies } from "../config";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

export const createImmersionApplicationRouter = (deps: AppDependencies) => {
  const immersionApplicationRouter = Router();

  immersionApplicationRouter
    .route(`/${immersionApplicationShareRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.shareApplicationByEmail.execute(req.body),
      ),
    );

  immersionApplicationRouter
    .route(`/${immersionApplicationsRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addImmersionApplication.execute(req.body),
      ),
    )
    .get(async (req, res) =>
      sendHttpResponse(
        req,
        res,
        () => deps.useCases.listImmersionApplication.execute(req.query),
        deps.authChecker,
      ),
    );

  immersionApplicationRouter
    .route(`/${validateImmersionApplicationRoute}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(
        req,
        res,
        () => deps.useCases.validateImmersionApplication.execute(req.params.id),
        deps.authChecker,
      ),
    );

  return immersionApplicationRouter;
};

import { Router } from "express";

import { validateEmailsTargets } from "shared";

import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createValidateEmailRouter = (deps: AppDependencies) => {
  const emailValidationRouter = Router();

  emailValidationRouter
    .route(validateEmailsTargets.validateEmail.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.validateEmail.execute(req.query as any),
      ),
    );
  return emailValidationRouter;
};

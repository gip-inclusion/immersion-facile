import { Router } from "express";
import { emailValidationTargets } from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createEmailValidationRouter = (deps: AppDependencies) => {
  const emailValidationRouter = Router();

  emailValidationRouter
    .route(emailValidationTargets.getEmailStatus.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.emailValidation.execute(req.query as any),
      ),
    );
  return emailValidationRouter;
};

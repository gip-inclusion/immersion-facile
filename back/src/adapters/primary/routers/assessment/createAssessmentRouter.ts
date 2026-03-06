import { Router } from "express";
import { assessmentRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";
import { getGenericAuthOrThrow } from "../../../../domains/core/authentication/connected-user/entities/user.helper";

export const createAssessmentRouter = (deps: AppDependencies) => {
  const expressRouter = Router();

  const assessmentSharedRouter = createExpressSharedRouter(
    assessmentRoutes,
    expressRouter,
  );

  assessmentSharedRouter.getAssessmentsForAgencyUser(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getAssessmentsForAgencyUser.execute(
          undefined,
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  return expressRouter;
};

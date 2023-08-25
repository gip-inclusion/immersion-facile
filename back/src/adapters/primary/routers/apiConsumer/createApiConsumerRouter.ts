import { Router } from "express";
import { apiConsumerTargets } from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createApiConsumerRouter = (deps: AppDependencies): Router => {
  const apiConsumerRouter = Router({ mergeParams: true });

  apiConsumerRouter.use(deps.adminAuthMiddleware);

  apiConsumerRouter
    .route(apiConsumerTargets.saveApiConsumer.url)
    .post((req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.saveApiConsumer.execute(
          req.body,
          req.payloads?.backOffice,
        ),
      ),
    );

  return apiConsumerRouter;
};

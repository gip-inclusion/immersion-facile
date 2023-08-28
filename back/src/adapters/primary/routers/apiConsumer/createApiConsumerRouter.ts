import { Router } from "express";
import { apiConsumerRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createApiConsumerRouter = (deps: AppDependencies): Router => {
  const apiConsumerExpressRouter = Router({ mergeParams: true });

  apiConsumerExpressRouter.use(deps.adminAuthMiddleware);

  const apiConsumerSharedRouter = createExpressSharedRouter(
    apiConsumerRoutes,
    apiConsumerExpressRouter,
  );

  apiConsumerSharedRouter.saveApiConsumer((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.saveApiConsumer.execute(req.body, req.payloads?.backOffice),
    ),
  );

  return apiConsumerExpressRouter;
};

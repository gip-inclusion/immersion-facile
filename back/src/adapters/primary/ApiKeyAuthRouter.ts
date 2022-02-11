import { Router } from "express";
import {
  getImmersionOfferByIdRoute,
  searchImmersionRoute,
} from "../../shared/routes";
import { AppDependencies } from "./config";
import { sendHttpResponse } from "./helpers/sendHttpResponse";

export const createApiKeyAuthRouter = (deps: AppDependencies) => {
  const authenticatedRouter = Router({ mergeParams: true });

  authenticatedRouter.use(deps.apiKeyAuthMiddleware);

  authenticatedRouter.route(`/${searchImmersionRoute}`).post(async (req, res) =>
    sendHttpResponse(req, res, async () => {
      await deps.useCases.callLaBonneBoiteAndUpdateRepositories.execute(
        req.body,
      );
      return deps.useCases.searchImmersion.execute(req.body, req.apiConsumer);
    }),
  );

  authenticatedRouter
    .route(`/${getImmersionOfferByIdRoute}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getImmersionOfferById.execute(
          req.params.id,
          req.apiConsumer,
        ),
      ),
    );

  return authenticatedRouter;
};

import { Router } from "express";
import { searchImmersionRoute } from "../../../shared/routes";
import { AppDependencies } from "../config";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

export const createSearchImmersionRouter = (deps: AppDependencies) => {
  // search route is in createApiKeyAuthRouter
  const searchRouterWithAuth = Router({ mergeParams: true });

  searchRouterWithAuth.use(deps.apiKeyAuthMiddleware);

  searchRouterWithAuth
    .route(`/${searchImmersionRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, async () => {
        await deps.useCases.callLaBonneBoiteAndUpdateRepositories.execute(
          req.body,
        );
        return deps.useCases.searchImmersion.execute(req.body, req.apiConsumer);
      }),
    );
};

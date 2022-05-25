import { Router } from "express";
import type { AppDependencies } from "../config/createAppDependencies";
import { searchImmersionRoute__v0 } from "shared/src/routes";
import { searchImmersionQueryParamsSchema } from "shared/src/searchImmersion/SearchImmersionQueryParams.schema";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

export const createSearchImmersionRouter = (deps: AppDependencies) => {
  // search route is in createApiKeyAuthRouter
  const searchRouterWithAuth = Router({ mergeParams: true });

  searchRouterWithAuth.use(deps.apiKeyAuthMiddlewareV0);

  searchRouterWithAuth
    .route(`/${searchImmersionRoute__v0}`)
    .get(async (req, res) => {
      const searchImmersionRequestDto = searchImmersionQueryParamsSchema.parse(
        req.query,
      );

      return sendHttpResponse(req, res, async () => {
        await deps.useCases.callLaBonneBoiteAndUpdateRepositories.execute(
          searchImmersionRequestDto,
        );
        return deps.useCases.searchImmersion.execute(
          searchImmersionRequestDto,
          req.apiConsumer,
        );
      });
    });
};

import { Router } from "express";
import type { AppDependencies } from "../config/createAppDependencies";
import { searchImmersionRoute__v0 } from "shared/src/routes";
import { searchImmersionRequestSchema } from "shared/src/searchImmersion/SearchImmersionRequest.schema";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

export const createSearchImmersionRouter = (deps: AppDependencies) => {
  // search route is in createApiKeyAuthRouter
  const searchRouterWithAuth = Router({ mergeParams: true });

  searchRouterWithAuth.use(deps.apiKeyAuthMiddleware);

  searchRouterWithAuth
    .route(`/${searchImmersionRoute__v0}`)
    .get(async (req, res) => {
      const searchImmersionRequestDto = searchImmersionRequestSchema.parse(
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

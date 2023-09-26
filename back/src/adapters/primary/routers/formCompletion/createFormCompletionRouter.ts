import { Router } from "express";
import {
  appellationRoute,
  romeAutocompleteInputSchema,
  romeRoute,
  siretRoutes,
} from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import { createLogger } from "../../../../utils/logger";
import type { AppDependencies } from "../../config/createAppDependencies";
import { validateAndParseZodSchema } from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

const logger = createLogger(__filename);

export const createFormCompletionRouter = (deps: AppDependencies) => {
  const expressFormCompletionRouter = Router();

  expressFormCompletionRouter
    .route(`/${appellationRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.appellationSearch.execute(req.query.searchText as any),
      ),
    );

  expressFormCompletionRouter.route(`/${romeRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, async () => {
      const query = validateAndParseZodSchema(
        romeAutocompleteInputSchema,
        req.query,
        logger,
      );
      return deps.useCases.romeSearch.execute(query.searchText);
    }),
  );

  const sharedFormCompletionRouter = createExpressSharedRouter(
    siretRoutes,
    expressFormCompletionRouter,
  );

  sharedFormCompletionRouter.getSiretInfo((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getSiret.execute(req.params),
    ),
  );

  sharedFormCompletionRouter.getSiretInfoIfNotAlreadySaved((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getSiretIfNotAlreadySaved.execute(req.params),
    ),
  );

  return expressFormCompletionRouter;
};

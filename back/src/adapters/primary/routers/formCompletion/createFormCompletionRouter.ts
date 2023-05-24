import { Router } from "express";
import {
  appellationRoute,
  romeAutocompleteInputSchema,
  romeRoute,
  siretTargets,
} from "shared";
import { createLogger } from "../../../../utils/logger";
import type { AppDependencies } from "../../config/createAppDependencies";
import { validateAndParseZodSchema } from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

const logger = createLogger(__filename);

export const createFormCompletionRouter = (deps: AppDependencies) => {
  const formCompletionRouter = Router();

  formCompletionRouter
    .route(`/${appellationRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.appellationSearch.execute(req.query.searchText as any),
      ),
    );

  formCompletionRouter.route(`/${romeRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, async () => {
      const query = validateAndParseZodSchema(
        romeAutocompleteInputSchema,
        req.query,
        logger,
      );
      return deps.useCases.romeSearch.execute(query.searchText);
    }),
  );

  formCompletionRouter
    .route(siretTargets.getSiretInfo.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getSiret.execute(req.params),
      ),
    );

  formCompletionRouter
    .route(siretTargets.getSiretInfoIfNotAlreadySaved.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getSiretIfNotAlreadySaved.execute(req.params),
      ),
    );

  return formCompletionRouter;
};

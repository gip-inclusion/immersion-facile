import { Router } from "express";
import { romeAutocompleteInputSchema } from "shared/src/romeAndAppellationDtos/romeAndAppellation.schema";
import {
  appellationRoute,
  getSiretIfNotSavedRoute,
  romeRoute,
  siretRoute,
} from "shared/src/routes";
import { createLogger } from "../../../utils/logger";
import type { AppDependencies } from "../config/createAppDependencies";
import { validateAndParseZodSchema } from "../helpers/httpErrors";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

const logger = createLogger(__filename);

export const createFormCompletionRouter = (deps: AppDependencies) => {
  const formCompletionRouter = Router();

  formCompletionRouter.route(`/${appellationRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, async () => {
      logger.info(req);
      return deps.useCases.appellationSearch.execute(
        req.query.searchText as any,
      );
    }),
  );

  formCompletionRouter.route(`/${romeRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, async () => {
      logger.info(req);
      const query = validateAndParseZodSchema(
        romeAutocompleteInputSchema,
        req.query,
      );
      return deps.useCases.romeSearch.execute(query.searchText);
    }),
  );

  formCompletionRouter
    .route(`/${siretRoute}/:siret`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getSiret.execute(req.params),
      ),
    );

  formCompletionRouter
    .route(`/${getSiretIfNotSavedRoute}/:siret`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getSiretIfNotAlreadySaved.execute(req.params),
      ),
    );

  return formCompletionRouter;
};

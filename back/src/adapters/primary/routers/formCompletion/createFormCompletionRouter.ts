import { Router } from "express";
import { formCompletionRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";

export const createFormCompletionRouter = (deps: AppDependencies) => {
  const expressFormCompletionRouter = Router();

  const formCompletionRouter = createExpressSharedRouter(
    formCompletionRoutes,
    expressFormCompletionRouter,
  );

  formCompletionRouter.appellation((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.appellationSearch.execute({
        searchText: req.query.searchText,
        fetchAppellationsFromNaturalLanguage: false,
      }),
    ),
  );

  formCompletionRouter.getSiretInfo((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getSiret.execute(req.params),
    ),
  );

  formCompletionRouter.getSiretInfoIfNotAlreadySaved((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getSiretIfNotAlreadySaved.execute(req.params),
    ),
  );

  return expressFormCompletionRouter;
};

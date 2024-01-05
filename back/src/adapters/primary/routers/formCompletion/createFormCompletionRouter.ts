import { Router } from "express";
import { formCompletionRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createFormCompletionRouter = (deps: AppDependencies) => {
  const expressFormCompletionRouter = Router();

  const formCompletionRouter = createExpressSharedRouter(
    formCompletionRoutes,
    expressFormCompletionRouter,
  );

  formCompletionRouter.appellation((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.appellationSearch.execute(req.query.searchText),
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

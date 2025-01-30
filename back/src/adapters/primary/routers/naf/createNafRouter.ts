import { Router } from "express";
import { nafRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";

export const createNafRouter = (deps: AppDependencies) => {
  const expressNafRouter = Router();

  const nafRouter = createExpressSharedRouter(nafRoutes, expressNafRouter);

  nafRouter.sectionSuggestions((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.nafSuggestions.execute(req.query),
    ),
  );

  return expressNafRouter;
};

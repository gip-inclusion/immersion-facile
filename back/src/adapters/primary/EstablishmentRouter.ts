import { Router } from "express";
import {
  editEstablishmentFormRouteWithApiKey,
  retrieveEstablishmentFormRouteWithApiKey,
} from "../../shared/routes";
import { AppDependencies } from "./config";
import { UnauthorizedError } from "./helpers/httpErrors";
import { sendHttpResponse } from "./helpers/sendHttpResponse";

export const createEstablishmentRouter = (deps: AppDependencies) => {
  const establishmentRouter = Router({ mergeParams: true });

  establishmentRouter.use(deps.establishmentJwtAuthMiddleware);

  establishmentRouter
    .route(`/${retrieveEstablishmentFormRouteWithApiKey}/:jwt`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req.payloads?.establishment) throw new UnauthorizedError();
        return deps.useCases.retrieveFormEstablishmentFromAggregates.execute(
          undefined,
          req.payloads.establishment,
        );
      }),
    );

  establishmentRouter
    .route(`/${editEstablishmentFormRouteWithApiKey}/:jwt`)
    .post(async (req, res) => {
      return sendHttpResponse(req, res, () => {
        if (!req.payloads?.establishment) throw new UnauthorizedError();
        return deps.useCases.editFormEstablishment.execute(
          req.body,
          req.payloads.establishment,
        );
      });
    });

  return establishmentRouter;
};

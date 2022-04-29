import { Router } from "express";
import {
  addEstablishmentFormRouteWithoutApiKey,
  contactEstablishmentRoute,
  editEstablishmentFormRouteWithApiKey,
  formAlreadyExistsRoute,
  requestEmailToUpdateFormRoute,
  retrieveEstablishmentFormRouteWithApiKey,
} from "shared/src/routes";
import { AppDependencies } from "../config";
import { UnauthorizedError } from "../helpers/httpErrors";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

export const createEstablishmentRouter = (deps: AppDependencies) => {
  const establishmentRouter = Router({ mergeParams: true });

  // Routes WITHOUT jwt auth
  establishmentRouter
    .route(`/${addEstablishmentFormRouteWithoutApiKey}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addFormEstablishment.execute(req.body),
      ),
    );

  establishmentRouter
    .route(`/${formAlreadyExistsRoute}/:siret`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.repositories.immersionOffer.hasEstablishmentFromFormWithSiret(
          req.params.siret,
        ),
      ),
    );

  establishmentRouter
    .route(`/${formAlreadyExistsRoute}/:siret`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.repositories.immersionOffer.hasEstablishmentFromFormWithSiret(
          req.params.siret,
        ),
      ),
    );

  establishmentRouter
    .route(`/${requestEmailToUpdateFormRoute}/:siret`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.requestEditFormEstablishment.execute(req.params.siret),
      ),
    );

  establishmentRouter
    .route(`/${contactEstablishmentRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.contactEstablishment.execute(req.body),
      ),
    );

  const establishmentRouterWithJwt = Router({ mergeParams: true });

  // Routes WITH jwt auth
  establishmentRouterWithJwt.use(deps.establishmentJwtAuthMiddleware);

  establishmentRouterWithJwt
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

  establishmentRouterWithJwt
    .route(`/${editEstablishmentFormRouteWithApiKey}/:jwt`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req.payloads?.establishment) throw new UnauthorizedError();
        return deps.useCases.editFormEstablishment.execute(
          req.body,
          req.payloads.establishment,
        );
      }),
    );

  establishmentRouter.use(establishmentRouterWithJwt);

  return establishmentRouter;
};

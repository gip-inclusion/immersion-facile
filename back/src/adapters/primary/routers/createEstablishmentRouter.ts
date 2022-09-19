import { Request, Router } from "express";
import {
  contactEstablishmentRoute,
  formAlreadyExistsRoute,
  formEstablishmentsRoute,
  requestEmailToUpdateFormRoute,
} from "shared/src/routes";
import type { AppDependencies } from "../config/createAppDependencies";
import { sendHttpResponse } from "../helpers/sendHttpResponse";

export const createEstablishmentRouter = (deps: AppDependencies) => {
  const establishmentRouter = Router({ mergeParams: true });

  // Routes WITHOUT jwt auth
  establishmentRouter
    .route(`/${formEstablishmentsRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addFormEstablishment.execute(req.body),
      ),
    );

  establishmentRouter
    .route(`/${formAlreadyExistsRoute}/:siret`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.isFormEstablishmentWithSiretAlreadySaved.execute(
          req.params.siret,
        ),
      ),
    );

  establishmentRouter
    .route(`/${formAlreadyExistsRoute}/:siret`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.isFormEstablishmentWithSiretAlreadySaved.execute(
          req.params.siret,
        ),
      ),
    );

  establishmentRouter
    .route(`/${requestEmailToUpdateFormRoute}/:siret`)
    .post(async (req, res) =>
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
  establishmentRouterWithJwt.use(deps.establishmentMagicLinkAuthMiddleware);

  establishmentRouterWithJwt
    .route(`/${formEstablishmentsRoute}/:siret`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () => {
        const establishmentPayload = getEstablishmentPayload(req);
        return deps.useCases.retrieveFormEstablishmentFromAggregates.execute(
          req.params.siret,
          establishmentPayload,
        );
      }),
    );

  establishmentRouterWithJwt
    .route(`/${formEstablishmentsRoute}`)
    .put(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.editFormEstablishment.execute(
          req.body,
          getEstablishmentPayload(req),
        ),
      ),
    );

  establishmentRouter.use(establishmentRouterWithJwt);

  return establishmentRouter;
};

// this considers the jwt checks have been made by the middleware
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const getEstablishmentPayload = (req: Request) => req.payloads!.establishment;

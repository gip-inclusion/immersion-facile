import { Router } from "express";
import {
  contactEstablishmentRoute,
  formAlreadyExistsRoute,
  formEstablishmentsRoute,
  requestEmailToUpdateFormRoute,
} from "shared";
import { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const establismentRouterWithoutJwt = (deps: AppDependencies): Router => {
  // Routes WITHOUT jwt auth
  const router = Router({ mergeParams: true });
  router
    .route(`/${formEstablishmentsRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addFormEstablishment.execute(req.body),
      ),
    );

  router
    .route(`/${formAlreadyExistsRoute}/:siret`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.isFormEstablishmentWithSiretAlreadySaved.execute(
          req.params.siret,
        ),
      ),
    );

  router
    .route(`/${formAlreadyExistsRoute}/:siret`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.isFormEstablishmentWithSiretAlreadySaved.execute(
          req.params.siret,
        ),
      ),
    );

  router
    .route(`/${requestEmailToUpdateFormRoute}/:siret`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.requestEditFormEstablishment.execute(req.params.siret),
      ),
    );

  router
    .route(`/${contactEstablishmentRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.contactEstablishment.execute(req.body),
      ),
    );
  return router;
};

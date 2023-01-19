import { Router } from "express";
import { contactEstablishmentRoute, establishmentTargets } from "shared";
import { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const establismentRouterWithoutJwt = (deps: AppDependencies): Router => {
  // Routes WITHOUT jwt auth
  const router = Router({ mergeParams: true });
  router
    .route(establishmentTargets.addFormEstablishment.url)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addFormEstablishment.execute(req.body),
      ),
    );

  router
    .route(establishmentTargets.isEstablishmentWithSiretAlreadyRegistered.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.isFormEstablishmentWithSiretAlreadySaved.execute(
          req.params.siret,
        ),
      ),
    );

  router
    .route(establishmentTargets.requestEmailToUpdateFormRoute.url)
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

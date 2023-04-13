import { Request, Router } from "express";
import { establishmentTargets } from "shared";
import { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const establishmentRouterWithMagicLinkJwt = (
  deps: AppDependencies,
): Router => {
  // this considers the jwt checks have been made by the middleware
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const getEstablishmentPayload = (req: Request) => req.payloads!.establishment;

  const router = Router({ mergeParams: true });
  // Routes WITH jwt auth
  router.use(deps.establishmentMagicLinkAuthMiddleware);

  router
    .route(establishmentTargets.getFormEstablishment.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.retrieveFormEstablishmentFromAggregates.execute(
          req.params.siret,
          getEstablishmentPayload(req),
        ),
      ),
    );

  router
    .route(establishmentTargets.updateFormEstablishment.url)
    .put(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.editFormEstablishment.execute(
          req.body,
          getEstablishmentPayload(req),
        ),
      ),
    );
  return router;
};

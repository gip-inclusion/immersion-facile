import { Request, Router } from "express";
import {
  BackOfficeJwtPayload,
  EstablishmentJwtPayload,
  establishmentTargets,
  siretTargets,
} from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createEstablishmentRouter = (deps: AppDependencies) => {
  const establishmentRouter = Router({ mergeParams: true });

  establishmentRouter
    .route(establishmentTargets.addFormEstablishment.url)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addFormEstablishment.execute(req.body),
      ),
    );

  establishmentRouter
    .route(siretTargets.isSiretAlreadySaved.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.isFormEstablishmentWithSiretAlreadySaved.execute(
          req.params.siret,
        ),
      ),
    );

  establishmentRouter
    .route(establishmentTargets.requestEmailToUpdateFormRoute.url)
    .post(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.requestEditFormEstablishment.execute(req.params.siret),
      ),
    );

  establishmentRouter
    .route(establishmentTargets.getFormEstablishment.url)
    .get(deps.establishmentMagicLinkAuthMiddleware, async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.retrieveFormEstablishmentFromAggregates.execute(
          req.params.siret,
          getEstablishmentPayload(req) ?? getBackOfficePayload(req),
        ),
      ),
    );

  establishmentRouter
    .route(establishmentTargets.updateFormEstablishment.url)
    .put(deps.establishmentMagicLinkAuthMiddleware, async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.editFormEstablishment.execute(
          req.body,
          getEstablishmentPayload(req) ?? getBackOfficePayload(req),
        ),
      ),
    );

  establishmentRouter
    .route(establishmentTargets.deleteEstablishment.url)
    .delete(deps.establishmentMagicLinkAuthMiddleware, async (req, res) =>
      sendHttpResponse(req, res, async () => {
        await deps.useCases.deleteEstablishment.execute(
          req.params,
          getBackOfficePayload(req),
        ),
          res.status(204);
      }),
    );

  return establishmentRouter;
};

const getEstablishmentPayload = (
  req: Request,
): EstablishmentJwtPayload | undefined => req.payloads?.establishment;

const getBackOfficePayload = (req: Request): BackOfficeJwtPayload | undefined =>
  req.payloads?.backOffice;

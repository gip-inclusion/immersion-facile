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
  makeUnauthenticatedEstablismentRouter(establishmentRouter, deps);
  makeAuthenticatedEstablishmentRouter(establishmentRouter, deps);
  return establishmentRouter;
};

const getEstablishmentPayload = (
  req: Request,
): EstablishmentJwtPayload | undefined => req.payloads?.establishment;

const getBackOfficePayload = (req: Request): BackOfficeJwtPayload | undefined =>
  req.payloads?.backOffice;

export const makeUnauthenticatedEstablismentRouter = (
  router: Router,
  { useCases }: AppDependencies,
): void => {
  router
    .route(establishmentTargets.addFormEstablishment.url)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        useCases.addFormEstablishment.execute(req.body),
      ),
    );

  router
    .route(siretTargets.isSiretAlreadySaved.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        useCases.isFormEstablishmentWithSiretAlreadySaved.execute(
          req.params.siret,
        ),
      ),
    );

  router
    .route(establishmentTargets.requestEmailToUpdateFormRoute.url)
    .post(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        useCases.requestEditFormEstablishment.execute(req.params.siret),
      ),
    );
};

const makeAuthenticatedEstablishmentRouter = (
  establishmentRouter: Router,
  { useCases, establishmentMagicLinkAuthMiddleware }: AppDependencies,
): void => {
  establishmentRouter.use(establishmentMagicLinkAuthMiddleware);

  establishmentRouter
    .route(establishmentTargets.getFormEstablishment.url)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        useCases.retrieveFormEstablishmentFromAggregates.execute(
          req.params.siret,
          getEstablishmentPayload(req) ?? getBackOfficePayload(req),
        ),
      ),
    );

  establishmentRouter
    .route(establishmentTargets.updateFormEstablishment.url)
    .put(async (req, res) =>
      sendHttpResponse(req, res, () =>
        useCases.editFormEstablishment.execute(
          req.body,
          getEstablishmentPayload(req) ?? getBackOfficePayload(req),
        ),
      ),
    );

  establishmentRouter
    .route(establishmentTargets.deleteEstablishment.url)
    .delete(async (req, res) =>
      sendHttpResponse(req, res, async () => {
        await useCases.deleteEstablishment.execute(
          req.params,
          getBackOfficePayload(req),
        ),
          res.status(204);
      }),
    );
};

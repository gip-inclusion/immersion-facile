import { Request, Router } from "express";
import {
  BackOfficeJwtPayload,
  EstablishmentJwtPayload,
  establishmentRoutes,
  formCompletionRoutes,
} from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createEstablishmentRouter = (deps: AppDependencies) => {
  const establishmentRouter = Router({ mergeParams: true });

  //TODO: Move this route to createFormCompletionRouter OR move isSiretAlreadySaved route on EstablishmentRoutes
  const sharedSiretRouter = createExpressSharedRouter(
    formCompletionRoutes,
    establishmentRouter,
  );

  sharedSiretRouter.isSiretAlreadySaved((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.isFormEstablishmentWithSiretAlreadySaved.execute(
        req.params.siret,
      ),
    ),
  );

  const establishmentSharedRouter = createExpressSharedRouter(
    establishmentRoutes,
    establishmentRouter,
  );

  establishmentSharedRouter.addFormEstablishment((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.addFormEstablishment.execute(req.body),
    ),
  );

  establishmentSharedRouter.requestEmailToUpdateFormRoute((req, res) =>
    sendHttpResponse(req, res.status(201), () =>
      deps.useCases.requestEditFormEstablishment.execute(req.params.siret),
    ),
  );

  establishmentSharedRouter.getFormEstablishment(
    deps.establishmentMagicLinkAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.retrieveFormEstablishmentFromAggregates.execute(
          req.params.siret,
          getEstablishmentPayload(req) ?? getBackOfficePayload(req),
        ),
      ),
  );

  establishmentSharedRouter.updateFormEstablishment(
    deps.establishmentMagicLinkAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.editFormEstablishment.execute(
          req.body,
          getEstablishmentPayload(req) ?? getBackOfficePayload(req),
        ),
      ),
  );

  establishmentSharedRouter.deleteEstablishment(
    deps.establishmentMagicLinkAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(204), () =>
        deps.useCases.deleteEstablishment.execute(
          req.params,
          getBackOfficePayload(req),
        ),
      ),
  );

  return establishmentRouter;
};

const getEstablishmentPayload = (
  req: Request,
): EstablishmentJwtPayload | undefined => req.payloads?.establishment;

const getBackOfficePayload = (req: Request): BackOfficeJwtPayload | undefined =>
  req.payloads?.backOffice;

import { Router } from "express";
import { errors, establishmentRoutes, formCompletionRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";

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

  establishmentSharedRouter.addFormEstablishment(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.insertEstablishmentAggregateFromForm.execute(
          {
            formEstablishment: req.body,
          },
          req.payloads?.currentUser,
        ),
      ),
  );

  establishmentSharedRouter.getFormEstablishment(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.retrieveFormEstablishmentFromAggregates.execute(
          req.params.siret,
          req.payloads?.inclusion,
        ),
      ),
  );

  establishmentSharedRouter.getEstablishmentNameAndAdmins(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        const currentUser = req.payloads?.currentUser;
        if (!currentUser) throw errors.user.unauthorized();
        return deps.useCases.getEstablishmentNameAndAdmins.execute(
          { siret: req.params.siret },
          currentUser,
        );
      }),
  );

  establishmentSharedRouter.updateFormEstablishment(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.updateEstablishmentAggregateFromForm.execute(
          { formEstablishment: req.body },
          req.payloads?.inclusion,
        ),
      ),
  );

  establishmentSharedRouter.deleteEstablishment(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(204), () =>
        deps.useCases.deleteEstablishment.execute(
          req.params,
          req.payloads?.currentUser,
        ),
      ),
  );

  return establishmentRouter;
};

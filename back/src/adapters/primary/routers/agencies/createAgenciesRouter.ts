import { Router } from "express";
import { agencyRoutes } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";
import { getCurrentUserOrThrow } from "../../../../domains/core/authentication/connected-user/entities/user.helper";

export const createAgenciesRouter = (deps: AppDependencies) => {
  const expressRouter = Router();

  const sharedAgencyRouter = createExpressSharedRouter(
    agencyRoutes,
    expressRouter,
  );

  sharedAgencyRouter.addAgency((req, res) =>
    sendHttpResponse(req, res, () => deps.useCases.addAgency.execute(req.body)),
  );

  sharedAgencyRouter.createUserForAgency(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.createUserForAgency.execute(
          req.body,
          getCurrentUserOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAgencyRouter.getAgencyById(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getAgencyById.execute(
          req.params.agencyId,
          getCurrentUserOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAgencyRouter.getAgencyOptionsByFilter((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.listAgencyOptionsByFilter.execute(req.query),
    ),
  );

  sharedAgencyRouter.getAgencyPublicInfoById((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getAgencyPublicInfoById.execute(req.query),
    ),
  );

  sharedAgencyRouter.getAgencyUsersByAgencyId(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getConnectedUsers.execute(
          { agencyId: req.params.agencyId },
          getCurrentUserOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAgencyRouter.getImmersionFacileAgencyId((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getImmersionFacileAgencyIdByKind.execute(),
    ),
  );

  sharedAgencyRouter.updateAgency(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.updateAgency.execute(
          req.body,
          getCurrentUserOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAgencyRouter.updateUserRoleForAgency(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(201), () =>
        deps.useCases.updateUserForAgency.execute(
          req.body,
          req.payloads?.currentUser,
        ),
      ),
  );

  sharedAgencyRouter.removeUserFromAgency(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.removeUserFromAgency.execute(
          {
            agencyId: req.params.agencyId,
            userId: req.params.userId,
          },
          getCurrentUserOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAgencyRouter.registerAgenciesToUser(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.registerAgencyToConnectedUser.execute(
          req.body,
          getCurrentUserOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  return expressRouter;
};

import { Router } from "express";
import { agencyRoutes, errors, type WithAgencyIdAndUserId } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";

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
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () => {
        const currentUser = req.payloads?.currentUser;
        if (!currentUser) throw errors.user.unauthorized();
        return await deps.useCases.createUserForAgency.execute(
          req.body,
          currentUser,
        );
      }),
  );

  sharedAgencyRouter.getAgencyById(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        const currentUser = req.payloads?.currentUser;
        if (!currentUser) throw errors.user.unauthorized();
        return deps.useCases.getAgencyById.execute(
          req.params.agencyId,
          currentUser,
        );
      }),
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
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        const currentUser = req.payloads?.currentUser;
        if (!currentUser) throw errors.user.unauthorized();
        return deps.useCases.getIcUsers.execute(
          { agencyId: req.params.agencyId },
          currentUser,
        );
      }),
  );

  sharedAgencyRouter.getImmersionFacileAgencyId((req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getImmersionFacileAgencyIdByKind.execute(),
    ),
  );

  sharedAgencyRouter.updateAgency(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.updateAgency.execute(req.body, req.payloads?.currentUser),
      ),
  );

  sharedAgencyRouter.updateUserRoleForAgency(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(201), () =>
        deps.useCases.updateUserForAgency.execute(
          req.body,
          req.payloads?.currentUser,
        ),
      ),
  );

  sharedAgencyRouter.removeUserFromAgency(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () => {
        const currentUser = req.payloads?.currentUser;
        if (!currentUser) throw errors.user.unauthorized();
        const userWithAgency: WithAgencyIdAndUserId = {
          agencyId: req.params.agencyId,
          userId: req.params.userId,
        };
        return await deps.useCases.removeUserFromAgency.execute(
          userWithAgency,
          currentUser,
        );
      }),
  );

  return expressRouter;
};

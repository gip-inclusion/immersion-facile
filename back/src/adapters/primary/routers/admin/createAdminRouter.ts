import { Router } from "express";
import {
  adminRoutes,
  agencyRoutes,
  errors,
  type GetDashboardParams,
} from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";
import { getGenericAuthOrThrow } from "../../../../domains/core/authentication/connected-user/entities/user.helper";

export const createAdminRouter = (deps: AppDependencies): Router => {
  const expressRouter = Router({ mergeParams: true });

  const sharedAdminRouter = createExpressSharedRouter(
    adminRoutes,
    expressRouter,
  );

  const sharedAgencyRouter = createExpressSharedRouter(
    agencyRoutes,
    expressRouter,
  );

  sharedAdminRouter.getDashboardUrl(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        if (req.params.dashboardName === "agency" && !req.query.agencyId)
          throw errors.agency.missingParamAgencyId();

        const useCaseParams: GetDashboardParams = {
          name: req.params.dashboardName as any,
          ...(req.query.agencyId ? req.query : {}),
        };
        return deps.useCases.getDashboard.execute(
          useCaseParams,
          req.payloads?.currentUser,
        );
      }),
  );

  sharedAdminRouter.getLastNotifications(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getLastNotifications.execute(
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAdminRouter.updateFeatureFlags(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(201), () =>
        deps.useCases.setFeatureFlag.execute(
          req.body,
          req.payloads?.currentUser,
        ),
      ),
  );

  sharedAdminRouter.addFormEstablishmentBatch(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addFormEstablishmentBatch.execute(
          req.body,
          req.payloads?.currentUser,
        ),
      ),
  );

  sharedAdminRouter.getConnectedUsers(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getConnectedUsers.execute(
          req.query,
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAdminRouter.getIcUser(deps.connectedUserAuthMiddleware, (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getConnectedUser.execute(
        req.params,
        getGenericAuthOrThrow(req.payloads?.currentUser),
      ),
    ),
  );

  sharedAdminRouter.updateUserRoleForAgency(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(201), () =>
        deps.useCases.updateUserForAgency.execute(
          req.body,
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAdminRouter.createUserForAgency(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.createUserForAgency.execute(
          req.body,
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAdminRouter.removeUserFromAgency(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.removeUserFromAgency.execute(
          req.params,
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAdminRouter.rejectIcUserForAgency(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(201), () =>
        deps.useCases.rejectUserForAgency.execute(
          req.body,
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAdminRouter.saveApiConsumer(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.saveApiConsumer.execute(
          req.body,
          req.payloads?.currentUser,
        ),
      ),
  );

  sharedAdminRouter.getAllApiConsumers(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getAllApiConsumers.execute(
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAdminRouter.getUsers(deps.connectedUserAuthMiddleware, (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getUsers.execute(
        req.query,
        getGenericAuthOrThrow(req.payloads?.currentUser),
      ),
    ),
  );

  sharedAgencyRouter.getAgencyById(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getAgencyById.execute(
          req.params.agencyId,
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAgencyRouter.updateAgencyStatus(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.updateAgencyStatus.execute(
          {
            ...req.body,
            id: req.params.agencyId,
          },
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAgencyRouter.updateAgency(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.updateAgency.execute(
          req.body,
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAgencyRouter.listAgenciesOptionsWithStatus(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.privateListAgencies.execute(
          req.query,
          getGenericAuthOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  return expressRouter;
};

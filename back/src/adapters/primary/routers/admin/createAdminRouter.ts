import { Router } from "express";
import {
  adminRoutes,
  agencyRoutes,
  errors,
  type GetDashboardParams,
  type WithAgencyIdAndUserId,
} from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";
import { getCurrentUserOrThrow } from "../../../../domains/core/authentication/connected-user/entities/user.helper";

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
      sendHttpResponse(req, res, () => {
        if (!req.payloads?.currentUser) throw errors.user.unauthorized();
        return deps.useCases.getLastNotifications.execute(
          req.payloads.currentUser,
        );
      }),
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
          getCurrentUserOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAdminRouter.getIcUser(deps.connectedUserAuthMiddleware, (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getConnectedUser.execute(
        { userId: req.params.userId },
        getCurrentUserOrThrow(req.payloads?.currentUser),
      ),
    ),
  );

  sharedAdminRouter.updateUserRoleForAgency(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(201), () =>
        deps.useCases.updateUserForAgency.execute(
          req.body,
          getCurrentUserOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAdminRouter.createUserForAgency(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(
        req,
        res,
        async () =>
          await deps.useCases.createUserForAgency.execute(
            req.body,
            getCurrentUserOrThrow(req.payloads?.currentUser),
          ),
      ),
  );

  sharedAdminRouter.removeUserFromAgency(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () => {
        const userWithAgency: WithAgencyIdAndUserId = {
          agencyId: req.params.agencyId,
          userId: req.params.userId,
        };
        return await deps.useCases.removeUserFromAgency.execute(
          userWithAgency,
          getCurrentUserOrThrow(req.payloads?.currentUser),
        );
      }),
  );

  sharedAdminRouter.rejectIcUserForAgency(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(201), () =>
        deps.useCases.rejectUserForAgency.execute(
          req.body,
          getCurrentUserOrThrow(req.payloads?.currentUser),
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
          getCurrentUserOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  sharedAdminRouter.getUsers(deps.connectedUserAuthMiddleware, (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.getUsers.execute(
        req.query,
        getCurrentUserOrThrow(req.payloads?.currentUser),
      ),
    ),
  );

  sharedAgencyRouter.getAgencyById(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getAgencyById.execute(
          req.params.agencyId,
          getCurrentUserOrThrow(req.payloads?.currentUser),
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
          getCurrentUserOrThrow(req.payloads?.currentUser),
        ),
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

  sharedAgencyRouter.listAgenciesOptionsWithStatus(
    deps.connectedUserAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.privateListAgencies.execute(
          req.query,
          getCurrentUserOrThrow(req.payloads?.currentUser),
        ),
      ),
  );

  return expressRouter;
};

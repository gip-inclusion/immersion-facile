import { Router } from "express";
import { GetDashboardParams, adminRoutes, agencyRoutes, errors } from "shared";
import { BadRequestError } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";

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
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        if (req.params.dashboardName === "agency" && !req.query.agencyId)
          throw new BadRequestError(
            "You need to provide agency Id in query params : http://.../agency?agencyId=your-id",
          );
        const useCaseParams: GetDashboardParams = {
          name: req.params.dashboardName as any,
          ...(req.query.agencyId ? req.query : {}),
        };

        return deps.useCases.getDashboard.execute(useCaseParams);
      }),
  );

  sharedAdminRouter.getLastNotifications(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, deps.useCases.getLastNotifications.execute),
  );

  sharedAdminRouter.updateFeatureFlags(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(201), () =>
        deps.useCases.setFeatureFlag.execute(
          req.body,
          req.payloads?.currentUser,
        ),
      ),
  );

  sharedAdminRouter.addFormEstablishmentBatch(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addFormEstablishmentBatch.execute(
          req.body,
          req.payloads?.currentUser,
        ),
      ),
  );

  sharedAdminRouter.getInclusionConnectedUsers(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getIcUsers.execute(req.query, req.payloads?.currentUser),
      ),
  );

  sharedAdminRouter.updateUserRoleForAgency(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(201), () =>
        deps.useCases.updateUserForAgency.execute(
          req.body,
          req.payloads?.currentUser,
        ),
      ),
  );

  sharedAdminRouter.addUserForAgency(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(201), async () => {
        const currentUser = req.payloads?.currentUser;
        if (!currentUser) throw errors.user.unauthorized();
        await deps.useCases.createUserForAgency.execute(req.body, currentUser);
      }),
  );

  sharedAdminRouter.rejectIcUserForAgency(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res.status(201), () =>
        deps.useCases.rejectIcUserForAgency.execute(
          req.body,
          req.payloads?.currentUser,
        ),
      ),
  );

  sharedAdminRouter.saveApiConsumer(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.saveApiConsumer.execute(
          req.body,
          req.payloads?.currentUser,
        ),
      ),
  );

  sharedAdminRouter.getAllApiConsumers(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getAllApiConsumers.execute({}),
      ),
  );

  sharedAgencyRouter.getAgencyAdminById(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getAgencyById.execute(req.params.agencyId),
      ),
  );

  sharedAgencyRouter.updateAgencyStatus(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.updateAgencyStatus.execute(
          {
            ...req.body,
            id: req.params.agencyId,
          },
          req.payloads?.currentUser,
        ),
      ),
  );

  sharedAgencyRouter.updateAgency(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.updateAgencyAdmin.execute(
          req.body,
          req.payloads?.currentUser,
        ),
      ),
  );

  sharedAgencyRouter.listAgenciesOptionsWithStatus(
    deps.inclusionConnectAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.privateListAgencies.execute(req.query),
      ),
  );

  return expressRouter;
};

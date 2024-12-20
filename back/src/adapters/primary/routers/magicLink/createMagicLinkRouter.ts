import { Router } from "express";
import { conventionMagicLinkRoutes, errors } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import { P, match } from "ts-pattern";
import type { AppDependencies } from "../../../../config/bootstrap/createAppDependencies";
import { sendHttpResponse } from "../../../../config/helpers/sendHttpResponse";

export const createMagicLinkRouter = (deps: AppDependencies) => {
  const expressRouter = Router({ mergeParams: true });

  const sharedRouter = createExpressSharedRouter(
    conventionMagicLinkRoutes,
    expressRouter,
  );

  sharedRouter.createAssessment(
    deps.conventionMagicLinkAuthMiddleware,
    async (req, res) =>
      sendHttpResponse(req, res.status(201), () =>
        deps.useCases.createAssessment.execute(
          req.body,
          req.payloads?.convention,
        ),
      ),
  );

  sharedRouter.getAssessment(
    deps.conventionMagicLinkAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getAssessment.execute(
          {
            conventionId: req.params.conventionId,
          },
          req.payloads?.convention,
        ),
      ),
  );

  sharedRouter.getConvention(
    deps.conventionMagicLinkAuthMiddleware,
    async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getConvention.execute(
          { conventionId: req.params.conventionId },
          req.payloads?.inclusion ?? req.payloads?.convention,
        ),
      ),
  );

  sharedRouter.updateConvention(
    deps.conventionMagicLinkAuthMiddleware,
    async (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!(req.payloads?.inclusion || req.payloads?.convention))
          throw errors.user.unauthorized();
        return deps.useCases.updateConvention.execute(
          req.body,
          req.payloads?.inclusion || req.payloads?.convention,
        );
      }),
  );

  sharedRouter.updateConventionStatus(
    deps.conventionMagicLinkAuthMiddleware,
    async (req, res) =>
      sendHttpResponse(req, res, () =>
        match(req.payloads)
          .with({ convention: P.not(P.nullish) }, ({ convention }) =>
            deps.useCases.updateConventionStatus.execute(req.body, convention),
          )
          .with({ inclusion: P.not(P.nullish) }, ({ inclusion }) =>
            deps.useCases.updateConventionStatus.execute(req.body, inclusion),
          )
          .otherwise(() => {
            throw errors.user.unauthorized();
          }),
      ),
  );

  sharedRouter.signConvention(
    deps.conventionMagicLinkAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req?.payloads?.convention) throw errors.user.unauthorized();
        return deps.useCases.signConvention.execute(
          req.params,
          req.payloads.convention,
        );
      }),
  );

  sharedRouter.getConventionStatusDashboard(
    deps.conventionMagicLinkAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req?.payloads?.convention) throw errors.user.unauthorized();
        return deps.useCases.getDashboard.execute({
          name: "conventionStatus",
          conventionId: req.payloads.convention.applicationId,
        });
      }),
  );

  sharedRouter.renewConvention(
    deps.conventionMagicLinkAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        const jwtPayload = req.payloads?.convention || req.payloads?.inclusion;
        return deps.useCases.renewConvention.execute(req.body, jwtPayload);
      }),
  );

  return expressRouter;
};

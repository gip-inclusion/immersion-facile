import { Router } from "express";
import { match, P } from "ts-pattern";
import { conventionMagicLinkRoutes, immersionAssessmentRoute } from "shared";
import { createExpressSharedRouter } from "shared-routes/express";
import type { AppDependencies } from "../../config/createAppDependencies";
import { UnauthorizedError } from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createMagicLinkRouter = (deps: AppDependencies) => {
  const expressRouter = Router({ mergeParams: true });

  expressRouter
    .route(`/auth/${immersionAssessmentRoute}`)
    .post(deps.applicationMagicLinkAuthMiddleware, async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.createImmersionAssessment.execute(
          req.body,
          req.payloads?.convention,
        ),
      ),
    );

  const sharedRouter = createExpressSharedRouter(
    conventionMagicLinkRoutes,
    expressRouter,
  );

  sharedRouter.getConvention(
    deps.applicationMagicLinkAuthMiddleware,
    async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getConvention.execute(
          { conventionId: req.params.conventionId },
          req.payloads?.backOffice ??
            req.payloads?.inclusion ??
            req.payloads?.convention,
        ),
      ),
  );

  sharedRouter.updateConvention(
    deps.applicationMagicLinkAuthMiddleware,
    async (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!(req.payloads?.backOffice || req.payloads?.convention))
          throw new UnauthorizedError();
        return deps.useCases.updateConvention.execute(req.body);
      }),
  );

  sharedRouter.updateConventionStatus(
    deps.applicationMagicLinkAuthMiddleware,
    async (req, res) =>
      sendHttpResponse(req, res, () =>
        match(req.payloads)
          .with({ backOffice: P.not(P.nullish) }, ({ backOffice }) =>
            deps.useCases.updateConventionStatus.execute(req.body, backOffice),
          )
          .with({ convention: P.not(P.nullish) }, ({ convention }) =>
            deps.useCases.updateConventionStatus.execute(req.body, convention),
          )
          .with({ inclusion: P.not(P.nullish) }, ({ inclusion }) =>
            deps.useCases.updateConventionStatus.execute(req.body, inclusion),
          )
          .otherwise(() => {
            throw new UnauthorizedError();
          }),
      ),
  );

  sharedRouter.signConvention(
    deps.applicationMagicLinkAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req?.payloads?.convention) throw new UnauthorizedError();
        return deps.useCases.signConvention.execute(
          undefined,
          req.payloads.convention,
        );
      }),
  );

  sharedRouter.getConventionStatusDashboard(
    deps.applicationMagicLinkAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req?.payloads?.convention) throw new UnauthorizedError();
        return deps.useCases.getDashboard.execute({
          name: "conventionStatus",
          conventionId: req.payloads.convention.applicationId,
        });
      }),
  );

  sharedRouter.renewConvention(
    deps.applicationMagicLinkAuthMiddleware,
    (req, res) =>
      sendHttpResponse(req, res, () => {
        const jwtPayload = req.payloads?.convention || req.payloads?.backOffice;
        return deps.useCases.renewConvention.execute(req.body, jwtPayload);
      }),
  );

  return expressRouter;
};

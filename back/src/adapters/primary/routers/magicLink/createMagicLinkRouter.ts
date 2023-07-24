import { Router } from "express";
import { conventionMagicLinkTargets, immersionAssessmentRoute } from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import {
  createRemoveRouterPrefix,
  RelativeUrl,
} from "../../createRemoveRouterPrefix";
import { UnauthorizedError } from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createMagicLinkRouter = (
  deps: AppDependencies,
): [RelativeUrl, Router] => {
  const authenticatedRouter = Router({ mergeParams: true });

  const { removeRouterPrefix, routerPrefix } =
    createRemoveRouterPrefix("/auth");

  authenticatedRouter.use(deps.applicationMagicLinkAuthMiddleware);

  authenticatedRouter
    .route(`/${immersionAssessmentRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.createImmersionAssessment.execute(
          req.body,
          req.payloads?.convention,
        ),
      ),
    );

  authenticatedRouter
    .route(removeRouterPrefix(conventionMagicLinkTargets.getConvention.url))
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getConvention.execute(
          { conventionId: req.params.conventionId },
          req.payloads?.backOffice ?? req.payloads?.convention,
        ),
      ),
    )
    .post(async (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!(req.payloads?.backOffice || req.payloads?.convention))
          throw new UnauthorizedError();
        return deps.useCases.updateConvention.execute(req.body);
      }),
    );

  authenticatedRouter
    .route(
      removeRouterPrefix(conventionMagicLinkTargets.updateConventionStatus.url),
    )
    .post(async (req, res) =>
      sendHttpResponse(req, res, () => {
        if (req.payloads?.backOffice)
          return deps.useCases.updateConventionStatus.execute(req.body, {
            conventionId: req.params.conventionId,
            role: req.payloads.backOffice.role,
          });

        if (!req?.payloads?.convention) throw new UnauthorizedError();

        return deps.useCases.updateConventionStatus.execute(req.body, {
          conventionId: req.payloads.convention.applicationId,
          role: req.payloads.convention.role,
        });
      }),
    );

  authenticatedRouter
    .route(removeRouterPrefix(conventionMagicLinkTargets.signConvention.url))
    .post(async (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req?.payloads?.convention) throw new UnauthorizedError();
        return deps.useCases.signConvention.execute(
          undefined,
          req.payloads.convention,
        );
      }),
    );

  authenticatedRouter
    .route(
      removeRouterPrefix(
        conventionMagicLinkTargets.getConventionStatusDashboard.url,
      ),
    )
    .get((req, res) =>
      // eslint-disable-next-line @typescript-eslint/require-await
      sendHttpResponse(req, res, async () => {
        if (!req?.payloads?.convention) throw new UnauthorizedError();
        return deps.useCases.getDashboard.execute({
          name: "conventionStatus",
          conventionId: req.payloads.convention.applicationId,
        });
      }),
    );

  return [routerPrefix, authenticatedRouter];
};

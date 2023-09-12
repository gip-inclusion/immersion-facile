import { Router } from "express";
import { match, P } from "ts-pattern";
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
          req.payloads?.backOffice ??
            req.payloads?.inclusion ??
            req.payloads?.convention,
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
        const params = {
          ...req.body,
          conventionId: req.params.conventionId,
        };
        return match(req.payloads)
          .with({ backOffice: P.not(P.nullish) }, ({ backOffice }) =>
            deps.useCases.updateConventionStatus.execute(params, backOffice),
          )
          .with({ convention: P.not(P.nullish) }, ({ convention }) =>
            deps.useCases.updateConventionStatus.execute(params, convention),
          )
          .with({ inclusion: P.not(P.nullish) }, ({ inclusion }) =>
            deps.useCases.updateConventionStatus.execute(params, inclusion),
          )
          .otherwise(() => {
            throw new UnauthorizedError();
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

  authenticatedRouter
    .route(removeRouterPrefix(conventionMagicLinkTargets.renewConvention.url))
    .post((req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req?.payloads?.convention) throw new UnauthorizedError();
        return deps.useCases.renewConvention.execute(
          req.body,
          req.payloads.convention,
        );
      }),
    );

  return [routerPrefix, authenticatedRouter];
};

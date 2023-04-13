import { Router } from "express";

import {
  conventionsRoute,
  getConventionStatusDashboard,
  immersionAssessmentRoute,
  signConventionRoute,
  updateConventionStatusRoute,
} from "shared";

import type { AppDependencies } from "../../config/createAppDependencies";
import { RelativeUrl } from "../../createRemoveRouterPrefix";
import { UnauthorizedError } from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createMagicLinkRouter = (
  deps: AppDependencies,
): [RelativeUrl, Router] => {
  const authenticatedRouter = Router({ mergeParams: true });

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
    .route(`/${conventionsRoute}/:conventionId`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () => {
        if (req.payloads?.backOffice) {
          return deps.useCases.getConvention.execute({
            id: req.params.conventionId,
          });
        }
        if (!req.payloads?.convention) throw new UnauthorizedError();
        return deps.useCases.getConvention.execute({
          id: req.payloads.convention.applicationId,
        });
      }),
    )
    .post(async (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req.payloads?.convention) throw new UnauthorizedError();
        return deps.useCases.updateConvention.execute({
          id: req.payloads.convention.applicationId,
          convention: req.body,
        });
      }),
    );

  authenticatedRouter
    .route(`/${updateConventionStatusRoute}/:conventionId`)
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
    .route(`/${signConventionRoute}/:jwt`)
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
    .route(`/${getConventionStatusDashboard}`)
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

  return ["/auth", authenticatedRouter];
};

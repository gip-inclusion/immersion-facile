import { Router } from "express";
import {
  ConventionReadDto,
  conventionsRoute,
  getConventionStatusDashboard,
  immersionAssessmentRoute,
  signConventionRoute,
  updateConventionStatusRoute,
} from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import { UnauthorizedError } from "../../helpers/httpErrors";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createMagicLinkRouter = (deps: AppDependencies) => {
  const authenticatedRouter = Router({ mergeParams: true });

  authenticatedRouter.use(deps.applicationMagicLinkAuthMiddleware);

  authenticatedRouter
    .route(`/${immersionAssessmentRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.createImmersionAssessment.execute(
          req.body,
          req.payloads?.application,
        ),
      ),
    );

  authenticatedRouter
    .route(`/${conventionsRoute}/:jwt`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () => {
        if (!req.payloads?.application) throw new UnauthorizedError();
        const result: ConventionReadDto =
          await deps.useCases.getConvention.execute({
            id: req.payloads.application.applicationId,
          });
        return result;
      }),
    )
    .post(async (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req.payloads?.application) throw new UnauthorizedError();
        return deps.useCases.updateConvention.execute({
          id: req.payloads.application.applicationId,
          convention: req.body,
        });
      }),
    );

  authenticatedRouter
    .route(`/${updateConventionStatusRoute}/:jwt`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req?.payloads?.application) throw new UnauthorizedError();
        return deps.useCases.updateConventionStatus.execute(
          req.body,
          req.payloads.application,
        );
      }),
    );

  authenticatedRouter
    .route(`/${signConventionRoute}/:jwt`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () => {
        if (!req?.payloads?.application) throw new UnauthorizedError();
        return deps.useCases.signConvention.execute(
          undefined,
          req.payloads.application,
        );
      }),
    );

  authenticatedRouter
    .route(`/${getConventionStatusDashboard}`)
    .get((req, res) =>
      // eslint-disable-next-line @typescript-eslint/require-await
      sendHttpResponse(req, res, async () => {
        if (!req?.payloads?.application) throw new UnauthorizedError();
        return deps.useCases.getDashboard.execute({
          name: "conventionStatus",
          conventionId: req.payloads.application.applicationId,
        });
      }),
    );

  return authenticatedRouter;
};

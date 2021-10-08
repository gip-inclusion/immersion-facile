import { Router } from "express";
import { authMiddleware } from "./authMiddleware";
import { sendHttpResponse } from "./helpers/sendHttpResponse";
import { immersionApplicationsRoute } from "../../shared/routes";
import { AppConfig } from "./config";
import { callUseCase } from "./helpers/callUseCase";
import {
  getImmersionApplicationRequestDtoSchema,
  immersionApplicationSchema,
  updateImmersionApplicationRequestDtoSchema,
} from "../../shared/ImmersionApplicationDto";

export const createMagicLinkRouter = (config: AppConfig) => {
  const authenticatedRouter = Router({ mergeParams: true });

  // Posting a new application doesn't require a JWT, so this is intentionally added before the auth middleware is plugged in
  authenticatedRouter
    .route(`/${immersionApplicationsRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        callUseCase({
          useCase: config.useCases.addDemandeImmersionML,
          validationSchema: immersionApplicationSchema,
          useCaseParams: req.body,
        }),
      ),
    );

  authenticatedRouter.use("/:jwt", authMiddleware);

  authenticatedRouter
    .route(`/${immersionApplicationsRoute}/:jwt`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        callUseCase({
          useCase: config.useCases.getDemandeImmersion,
          validationSchema: getImmersionApplicationRequestDtoSchema,
          useCaseParams: { id: req.jwtPayload.applicationId },
        }),
      ),
    )
    .post(async (req, res) =>
      sendHttpResponse(req, res, () => {
        return callUseCase({
          useCase: config.useCases.updateDemandeImmersion,
          validationSchema: updateImmersionApplicationRequestDtoSchema,
          useCaseParams: {
            id: req.jwtPayload.applicationId,
            demandeImmersion: req.body,
          },
        });
      }),
    );

  return authenticatedRouter;
};

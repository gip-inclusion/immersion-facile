import { Router } from "express";
import {
  getImmersionApplicationRequestDtoSchema,
  immersionApplicationSchema,
  updateImmersionApplicationRequestDtoSchema,
  updateImmersionApplicationStatusRequestSchema,
} from "../../shared/ImmersionApplicationDto";
import {
  immersionApplicationsRoute,
  updateApplicationStatusRoute,
} from "../../shared/routes";
import { authMiddleware } from "./authMiddleware";
import { AppConfig } from "./config";
import { callUseCase } from "./helpers/callUseCase";
import { sendHttpResponse } from "./helpers/sendHttpResponse";

export const createMagicLinkRouter = (config: AppConfig) => {
  const authenticatedRouter = Router({ mergeParams: true });

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

  authenticatedRouter
    .route(`/${updateApplicationStatusRoute}/:jwt`)
    .post(async (req, res) => {
      sendHttpResponse(req, res, () =>
        callUseCase({
          useCase: config.useCases.updateImmersionApplicationStatus,
          validationSchema: updateImmersionApplicationStatusRequestSchema,
          useCaseParams: req.body,
          jwtPayload: req.jwtPayload,
        }),
      );
    });

  return authenticatedRouter;
};

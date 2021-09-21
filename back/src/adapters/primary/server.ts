import bodyParser from "body-parser";
import express, { Express, Router } from "express";
import PinoHttp from "pino-http";
import {
  demandeImmersionDtoSchema,
  getDemandeImmersionRequestDtoSchema,
  updateDemandeImmersionRequestDtoSchema,
  validateDemandeImmersionRequestDtoSchema,
} from "../../shared/DemandeImmersionDto";
import { FeatureFlags } from "../../shared/featureFlags";
import {
  demandesImmersionRoute,
  siretRoute,
  validateDemandeRoute,
} from "../../shared/routes";
import { logger } from "../../utils/logger";
import { getAuthChecker, getEventCrawler, getUsecases } from "./config";
import { callUseCase } from "./helpers/callUseCase";
import { sendHttpResponse } from "./helpers/sendHttpResponse";

export type AppConfig = {
  featureFlags: FeatureFlags;
};

export const createApp = ({ featureFlags }: AppConfig): Express => {
  const app = express();
  const router = Router();

  app.use(bodyParser.json());

  if (process.env.NODE_ENV !== "test") {
    app.use(PinoHttp({ logger }));
  }

  router.route("/").get((req, res) => {
    return res.json({ message: "Hello World !" });
  });

  const authChecker = getAuthChecker();
  const useCases = getUsecases(featureFlags);

  router
    .route(`/${demandesImmersionRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        callUseCase({
          useCase: useCases.addDemandeImmersion,
          validationSchema: demandeImmersionDtoSchema,
          useCaseParams: req.body,
        })
      )
    )
    .get(async (req, res) => {
      sendHttpResponse(
        req,
        res,
        () => useCases.listDemandeImmersion.execute(),
        authChecker
      );
    });
  router.route(`/${validateDemandeRoute}/:id`).get(async (req, res) => {
    sendHttpResponse(
      req,
      res,
      () =>
        callUseCase({
          useCase: useCases.validateDemandeImmersion,
          validationSchema: validateDemandeImmersionRequestDtoSchema,
          useCaseParams: req.params,
        }),
      authChecker
    );
  });

  const uniqueDemandeImmersionRouter = Router({ mergeParams: true });
  router.use(`/${demandesImmersionRoute}`, uniqueDemandeImmersionRouter);

  uniqueDemandeImmersionRouter
    .route(`/:id`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        callUseCase({
          useCase: useCases.getDemandeImmersion,
          validationSchema: getDemandeImmersionRequestDtoSchema,
          useCaseParams: req.params,
        })
      )
    )
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        callUseCase({
          useCase: useCases.updateDemandeImmersion,
          validationSchema: updateDemandeImmersionRequestDtoSchema,
          useCaseParams: { id: req.params.id, demandeImmersion: req.body },
        })
      )
    );

  router.route(`/${siretRoute}/:siret`).get(async (req, res) =>
    sendHttpResponse(req, res, async () => {
      logger.info(req);
      return useCases.getSiret.execute(req.params.siret);
    })
  );

  app.use(router);

  getEventCrawler(featureFlags).startCrawler();

  return app;
};

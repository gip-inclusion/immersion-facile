import bodyParser from "body-parser";
import express, { Express, Router } from "express";
import PinoHttp from "pino-http";
import { FeatureFlags } from "../../shared/featureFlags";
import {
  getImmersionApplicationRequestDtoSchema,
  immersionApplicationSchema,
  updateImmersionApplicationRequestDtoSchema,
  validateImmersionApplicationRequestDtoSchema,
} from "../../shared/ImmersionApplicationDto";
import { immersionOfferSchema } from "../../shared/ImmersionOfferDto";
import { romeSearchRequestSchema } from "../../shared/rome";
import {
  immersionApplicationsRoute,
  immersionOffersRoute,
  romeRoute,
  siretRoute,
  validateDemandeRoute,
} from "../../shared/routes";
import { createLogger } from "../../utils/logger";
import { createConfig } from "./config";
import { callUseCase } from "./helpers/callUseCase";
import { sendHttpResponse } from "./helpers/sendHttpResponse";
import { createMagicLinkRouter } from "./MagicLinkRouter";
import expressPrometheusMiddleware = require("express-prometheus-middleware");

const logger = createLogger(__filename);

export type AppConfig = {
  featureFlags: FeatureFlags;
};

const metrics = expressPrometheusMiddleware({
  metricsPath: "/__metrics",
  collectDefaultMetrics: true,
});

export const createApp = ({ featureFlags }: AppConfig): Express => {
  const app = express();
  const router = Router();

  if (process.env.NODE_ENV !== "test") {
    app.use(PinoHttp({ logger }));
  }

  app.use(metrics);

  app.use(bodyParser.json());

  router.route("/").get((req, res) => {
    return res.json({ message: "Hello World !" });
  });

  const config = createConfig(featureFlags);

  router
    .route(`/${immersionApplicationsRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        callUseCase({
          useCase: config.useCases.addDemandeImmersion,
          validationSchema: immersionApplicationSchema,
          useCaseParams: req.body,
        }),
      ),
    )
    .get(async (req, res) => {
      sendHttpResponse(
        req,
        res,
        () => config.useCases.listDemandeImmersion.execute(),
        config.authChecker,
      );
    });

  router.route(`/${validateDemandeRoute}/:id`).get(async (req, res) => {
    sendHttpResponse(
      req,
      res,
      () =>
        callUseCase({
          useCase: config.useCases.validateDemandeImmersion,
          validationSchema: validateImmersionApplicationRequestDtoSchema,
          useCaseParams: req.params.id,
        }),
      config.authChecker,
    );
  });

  const demandeImmersionRouter = Router({ mergeParams: true });
  router.use(`/${immersionApplicationsRoute}`, demandeImmersionRouter);

  demandeImmersionRouter
    .route(`/:id`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        callUseCase({
          useCase: config.useCases.getDemandeImmersion,
          validationSchema: getImmersionApplicationRequestDtoSchema,
          useCaseParams: req.params,
        }),
      ),
    )
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        callUseCase({
          useCase: config.useCases.updateDemandeImmersion,
          validationSchema: updateImmersionApplicationRequestDtoSchema,
          useCaseParams: { id: req.params.id, demandeImmersion: req.body },
        }),
      ),
    );

  router.route(`/${immersionOffersRoute}`).post(async (req, res) =>
    sendHttpResponse(req, res, () =>
      callUseCase({
        useCase: config.useCases.addImmersionOffer,
        validationSchema: immersionOfferSchema,
        useCaseParams: req.body,
      }),
    ),
  );

  router.route(`/${romeRoute}`).get(async (req, res) => {
    sendHttpResponse(req, res, async () => {
      logger.info(req);
      return callUseCase({
        useCase: config.useCases.romeSearch,
        validationSchema: romeSearchRequestSchema,
        useCaseParams: req.query.searchText,
      });
    });
  });

  router.route(`/${siretRoute}/:siret`).get(async (req, res) =>
    sendHttpResponse(req, res, async () => {
      logger.info(req);
      return config.useCases.getSiret.execute(req.params.siret);
    }),
  );

  app.use(router);
  app.use("/auth", createMagicLinkRouter(config));

  config.eventBus.subscribe(
    "ImmersionApplicationSubmittedByBeneficiary",
    (event) =>
      config.useCases.confirmToBeneficiaryThatApplicationCorrectlySubmitted.execute(
        event.payload,
      ),
  );

  config.eventBus.subscribe(
    "ImmersionApplicationSubmittedByBeneficiary",
    (event) =>
      config.useCases.confirmToMentorThatApplicationCorrectlySubmitted.execute(
        event.payload,
      ),
  );

  config.eventBus.subscribe(
    "ImmersionApplicationSubmittedByBeneficiary",
    (event) =>
      config.useCases.notifyToTeamApplicationSubmittedByBeneficiary.execute(
        event.payload,
      ),
  );

  config.eventBus.subscribe(
    "FinalImmersionApplicationValidationByAdmin",
    (event) =>
      config.useCases.notifyAllActorsOfFinalApplicationValidation.execute(
        event.payload,
      ),
  );

  config.eventCrawler.startCrawler();

  return app;
};

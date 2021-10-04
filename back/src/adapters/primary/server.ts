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
import { immersionOfferSchema } from "../../shared/ImmersionOfferDto";
import { romeSearchRequestSchema } from "../../shared/rome";
import {
  demandesImmersionRoute,
  immersionOffersRoute,
  romeRoute,
  siretRoute,
  validateDemandeRoute,
} from "../../shared/routes";
import { createLogger } from "../../utils/logger";
import { createMagicLinkRouter } from "./MagicLinkRouter";
import { createConfig } from "./config";
import { callUseCase } from "./helpers/callUseCase";
import { sendHttpResponse } from "./helpers/sendHttpResponse";

const logger = createLogger(__filename);

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

  const config = createConfig(featureFlags);

  router
    .route(`/${demandesImmersionRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        callUseCase({
          useCase: config.useCases.addDemandeImmersion,
          validationSchema: demandeImmersionDtoSchema,
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
          validationSchema: validateDemandeImmersionRequestDtoSchema,
          useCaseParams: req.params.id,
        }),
      config.authChecker,
    );
  });

  const demandeImmersionRouter = Router({ mergeParams: true });
  router.use(`/${demandesImmersionRoute}`, demandeImmersionRouter);

  demandeImmersionRouter
    .route(`/:id`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        callUseCase({
          useCase: config.useCases.getDemandeImmersion,
          validationSchema: getDemandeImmersionRequestDtoSchema,
          useCaseParams: req.params,
        }),
      ),
    )
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        callUseCase({
          useCase: config.useCases.updateDemandeImmersion,
          validationSchema: updateDemandeImmersionRequestDtoSchema,
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

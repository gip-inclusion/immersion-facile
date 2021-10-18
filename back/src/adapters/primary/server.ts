import bodyParser from "body-parser";
import express, { Express, Router } from "express";
import PinoHttp from "pino-http";
import {
  getImmersionApplicationRequestDtoSchema,
  immersionApplicationSchema,
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
import { AppConfig } from "./appConfig";
import { createAppDependencies } from "./config";
import { callUseCase } from "./helpers/callUseCase";
import { sendHttpResponse } from "./helpers/sendHttpResponse";
import { createMagicLinkRouter } from "./MagicLinkRouter";
import expressPrometheusMiddleware = require("express-prometheus-middleware");
import { subscribeToEvents } from "./subscribeToEvents";

const logger = createLogger(__filename);

const metrics = expressPrometheusMiddleware({
  metricsPath: "/__metrics",
  collectDefaultMetrics: true,
});

export const createApp = async (config: AppConfig): Promise<Express> => {
  const app = express();
  const router = Router();
  app.use(PinoHttp({ logger }));

  app.use(metrics);

  app.use(bodyParser.json());

  router.route("/").get((req, res) => {
    return res.json({ message: "Hello World !" });
  });

  const deps = await createAppDependencies(config);

  router
    .route(`/${immersionApplicationsRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        callUseCase({
          useCase: deps.useCases.addDemandeImmersion,
          validationSchema: immersionApplicationSchema,
          useCaseParams: req.body,
        }),
      ),
    )
    .get(async (req, res) => {
      sendHttpResponse(
        req,
        res,
        () => deps.useCases.listDemandeImmersion.execute(),
        deps.authChecker,
      );
    });

  router.route(`/${validateDemandeRoute}/:id`).get(async (req, res) => {
    sendHttpResponse(
      req,
      res,
      () =>
        callUseCase({
          useCase: deps.useCases.validateDemandeImmersion,
          validationSchema: validateImmersionApplicationRequestDtoSchema,
          useCaseParams: req.params.id,
        }),
      deps.authChecker,
    );
  });

  const demandeImmersionRouter = Router({ mergeParams: true });
  router.use(`/admin`, demandeImmersionRouter);

  demandeImmersionRouter
    .route(`/${immersionApplicationsRoute}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(
        req,
        res,
        () =>
          callUseCase({
            useCase: deps.useCases.getDemandeImmersion,
            validationSchema: getImmersionApplicationRequestDtoSchema,
            useCaseParams: req.params,
          }),
        deps.authChecker,
      ),
    );

  router.route(`/${immersionOffersRoute}`).post(async (req, res) =>
    sendHttpResponse(req, res, () =>
      callUseCase({
        useCase: deps.useCases.addImmersionOffer,
        validationSchema: immersionOfferSchema,
        useCaseParams: req.body,
      }),
    ),
  );

  router.route(`/${romeRoute}`).get(async (req, res) => {
    sendHttpResponse(req, res, async () => {
      logger.info(req);
      return callUseCase({
        useCase: deps.useCases.romeSearch,
        validationSchema: romeSearchRequestSchema,
        useCaseParams: req.query.searchText,
      });
    });
  });

  router.route(`/${siretRoute}/:siret`).get(async (req, res) =>
    sendHttpResponse(req, res, async () => {
      logger.info(req);
      return deps.useCases.getSiret.execute(req.params.siret);
    }),
  );

  router.route(`/${immersionApplicationsRoute}`).post(async (req, res) =>
    sendHttpResponse(req, res, () =>
      callUseCase({
        useCase: deps.useCases.addDemandeImmersionML,
        validationSchema: immersionApplicationSchema,
        useCaseParams: req.body,
      }),
    ),
  );

  app.use(router);
  app.use("/auth", createMagicLinkRouter(deps));

  subscribeToEvents(deps);

  deps.eventCrawler.startCrawler();

  return app;
};

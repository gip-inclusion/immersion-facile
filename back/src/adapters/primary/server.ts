import bodyParser from "body-parser";
import express, { Express, Router } from "express";
import PinoHttp from "pino-http";
import { EventCrawler } from "../../domain/core/eventBus/EventCrawler";
import {
  agenciesRoute,
  contactEstablishmentRoute,
  extractImmersionApplicationsExcelRoute,
  generateMagicLinkRoute,
  immersionApplicationsRoute,
  immersionOffersRoute,
  renewMagicLinkRoute,
  romeRoute,
  siretRoute,
  validateImmersionApplicationRoute,
} from "../../shared/routes";
import { createLogger } from "../../utils/logger";
import { createApiKeyAuthRouter } from "./ApiKeyAuthRouter";
import { AppConfig } from "./appConfig";
import { createAppDependencies, Repositories } from "./config";
import { sendHttpResponse, sendZipResponse } from "./helpers/sendHttpResponse";
import { createMagicLinkRouter } from "./MagicLinkRouter";
import { subscribeToEvents } from "./subscribeToEvents";
import expressPrometheusMiddleware = require("express-prometheus-middleware");

const logger = createLogger(__filename);

const metrics = expressPrometheusMiddleware({
  metricsPath: "/__metrics",
  collectDefaultMetrics: true,
});

export const createApp = async (
  config: AppConfig,
): Promise<{
  app: Express;
  repositories: Repositories;
  eventCrawler: EventCrawler;
}> => {
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
    .route(`/${extractImmersionApplicationsExcelRoute}`)
    .get(async (req, res) => {
      sendZipResponse(
        req,
        res,
        async () => {
          const archivePath = "./exportAgencies.zip";
          await deps.useCases.exportImmersionApplicationsAsExcelArchive.execute(
            archivePath,
          );
          return archivePath;
        },
        deps.authChecker,
      );
    });

  router
    .route(`/${immersionApplicationsRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addImmersionApplication.execute(req.body),
      ),
    )
    .get(async (req, res) =>
      sendHttpResponse(
        req,
        res,
        () => deps.useCases.listImmersionApplication.execute(req.query),
        deps.authChecker,
      ),
    );

  router
    .route(`/${validateImmersionApplicationRoute}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(
        req,
        res,
        () => deps.useCases.validateImmersionApplication.execute(req.params.id),
        deps.authChecker,
      ),
    );

  router.route(`/admin/${generateMagicLinkRoute}`).get(async (req, res) =>
    sendHttpResponse(
      req,
      res,
      () =>
        deps.useCases.generateMagicLink.execute({
          applicationId: req.query.id,
          role: req.query.role,
          expired: req.query.expired === "true",
        } as any),
      deps.authChecker,
    ),
  );

  router.route(`/${renewMagicLinkRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.renewMagicLink.execute({
        expiredJwt: req.query.expiredJwt,
        linkFormat: req.query.linkFormat,
      } as any),
    ),
  );

  const immersionApplicationRouter = Router({ mergeParams: true });
  router.use(`/admin`, immersionApplicationRouter);

  immersionApplicationRouter
    .route(`/${immersionApplicationsRoute}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(
        req,
        res,
        () => deps.useCases.getImmersionApplication.execute(req.params),
        deps.authChecker,
      ),
    );

  router
    .route(`/${immersionOffersRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.addFormEstablishment.execute(req.body),
      ),
    );

  router
    .route(`/${contactEstablishmentRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.contactEstablishment.execute(req.body),
      ),
    );

  router.route(`/${romeRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, async () => {
      logger.info(req);
      return deps.useCases.romeSearch.execute(req.query.searchText as any);
    }),
  );

  router
    .route(`/${siretRoute}/:siret`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getSiret.execute(req.params),
      ),
    );

  router.route(`/${agenciesRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, async () =>
      deps.useCases.listAgencies.execute({
        position: {
          lat: parseFloat(req.query.lat as any),
          lon: parseFloat(req.query.lon as any),
        } as any,
      }),
    ),
  );

  app.use(router);
  app.use("/auth", createMagicLinkRouter(deps));
  app.use(createApiKeyAuthRouter(deps));

  subscribeToEvents(deps);

  deps.eventCrawler.startCrawler();

  return {
    app,
    repositories: deps.repositories,
    eventCrawler: deps.eventCrawler,
  };
};

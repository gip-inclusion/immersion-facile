import bodyParser from "body-parser";
import express, { Express, Router } from "express";
import PinoHttp from "pino-http";
import {
  GenerateApiConsumerJtw,
  GenerateMagicLinkJwt,
} from "../../domain/auth/jwt";
import { EventCrawler } from "../../domain/core/eventBus/EventCrawler";
import { createLogger } from "../../utils/logger";
import { AppConfig } from "./config/appConfig";
import { createAppDependencies } from "./config/createAppDependencies";
import { Repositories } from "./config/repositoriesConfig";
import { createAdminRouter } from "./routers/createAdminRouter";
import { createAgenciesRouter } from "./routers/createAgenciesRouter";
import { createApiKeyAuthRouter } from "./routers/createApiKeyAuthRouter";
import { createEstablishmentRouter } from "./routers/createEstablishmentRouter";
import { createExcelExportRouter } from "./routers/createExcelExportRouter";
import { createFormCompletionRouter } from "./routers/createFormCompletionRouter";
import { createConventionRouter } from "./routers/createConventionRouter";
import { createMagicLinkRouter } from "./routers/createMagicLinkRouter";
import { createPeConnectRouter } from "./routers/createPeConnectRouter";
import { createTechnicalRouter } from "./routers/createTechnicalRouter";
import { subscribeToEvents } from "./subscribeToEvents";
import expressPrometheusMiddleware from "express-prometheus-middleware";
import { createApiKeyAuthRouterV1 } from "./routers/createApiKeyAuthRouter.v1";
import { Clock } from "../../domain/core/ports/Clock";

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
  generateApiJwt: GenerateApiConsumerJtw;
  generateMagicLinkJwt: GenerateMagicLinkJwt;
  clock: Clock;
}> => {
  const app = express();
  const router = Router();
  app.use(PinoHttp({ logger }));
  app.use(metrics);
  app.use(bodyParser.json());

  router.route("/").get((_req, res) => res.json({ message: "Hello World !" }));

  const deps = await createAppDependencies(config);

  app.use(router);
  // Those routes must be defined BEFORE the others
  app.use("/auth", createMagicLinkRouter(deps));
  app.use("/admin", createAdminRouter(deps));
  app.use("/v1", createApiKeyAuthRouterV1(deps));
  // ----
  app.use(createFormCompletionRouter(deps));
  app.use(createTechnicalRouter(deps));
  app.use(createConventionRouter(deps));
  app.use(createAgenciesRouter(deps));
  app.use(createExcelExportRouter(deps));
  app.use(createPeConnectRouter(deps));
  app.use(createApiKeyAuthRouter(deps));
  app.use(createEstablishmentRouter(deps));

  subscribeToEvents(deps);

  deps.eventCrawler.startCrawler();

  return {
    app,
    repositories: deps.repositories,
    eventCrawler: deps.eventCrawler,
    generateApiJwt: deps.generateApiJwt,
    generateMagicLinkJwt: deps.generateMagicLinkJwt,
    clock: deps.clock,
  };
};

import bodyParser from "body-parser";
import express, { Express, Router } from "express";
import expressPrometheusMiddleware from "express-prometheus-middleware";
import PinoHttp from "pino-http";
import {
  GenerateApiConsumerJwt,
  GenerateAuthenticatedUserJwt,
  GenerateBackOfficeJwt,
  GenerateConventionJwt,
  GenerateEditFormEstablishmentJwt,
} from "../../domain/auth/jwt";
import { EventCrawler } from "../../domain/core/eventBus/EventCrawler";
import { UuidGenerator } from "../../domain/core/ports/UuidGenerator";
import { createLogger } from "../../utils/logger";
import { AppConfig } from "./config/appConfig";
import { createAppDependencies } from "./config/createAppDependencies";
import { Gateways } from "./config/createGateways";
import { InMemoryUnitOfWork } from "./config/uowConfig";
import { createAddressRouter } from "./routers/address/createAddressRouter";
import { createAdminRouter } from "./routers/admin/createAdminRouter";
import { createAgenciesRouter } from "./routers/agencies/createAgenciesRouter";
import { createApiKeyAuthRouter } from "./routers/apiKeyAuthRouter/createApiKeyAuthRouter";
import { createApiKeyAuthRouterV1 } from "./routers/apiKeyAuthRouter/createApiKeyAuthRouter.v1";
import { createApiKeyAuthRouterV2 } from "./routers/apiKeyAuthRouter/createApiKeyAuthRouter.v2";
import { createConventionRouter } from "./routers/convention/createConventionRouter";
import { createEstablishmentRouter } from "./routers/createEstablishment/createEstablishmentRouter";
import { createValidateEmailRouter } from "./routers/emailValidation/createValidateEmailRouter";
import { createFormCompletionRouter } from "./routers/formCompletion/createFormCompletionRouter";
import { createHelloWorldRouter } from "./routers/helloWorld/createHelloWorldRouter";
import { createInclusionConnectedAllowedRouter } from "./routers/inclusionConnect/createInclusionConnectedAllowedRouter";
import { createInclusionConnectRouter } from "./routers/inclusionConnect/createInclusionConnectRouter";
import { createMagicLinkRouter } from "./routers/magicLink/createMagicLinkRouter";
import { createPeConnectRouter } from "./routers/peConnect/createPeConnectRouter";
import { createSearchImmersionRouter } from "./routers/searchImmersion/createSearchImmersionRouter";
import { createTechnicalRouter } from "./routers/technical/createTechnicalRouter";
import { subscribeToEvents } from "./subscribeToEvents";

const logger = createLogger(__filename);

const metricsPageUrl = "__metrics";
const metrics = expressPrometheusMiddleware({
  metricsPath: `/${metricsPageUrl}`,
  collectDefaultMetrics: true,
});

type CreateAppProperties = {
  app: Express;
  gateways: Gateways;
  eventCrawler: EventCrawler;
  generateApiJwt: GenerateApiConsumerJwt;
  generateConventionJwt: GenerateConventionJwt;
  generateEditEstablishmentJwt: GenerateEditFormEstablishmentJwt;
  generateAuthenticatedUserJwt: GenerateAuthenticatedUserJwt;
  generateBackOfficeJwt: GenerateBackOfficeJwt;
  uuidGenerator: UuidGenerator;
  inMemoryUow?: InMemoryUnitOfWork;
};

export const createApp = async (
  config: AppConfig,
): Promise<CreateAppProperties> => {
  const app = express();
  const router = Router();
  app.use(
    PinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url?.includes(metricsPageUrl) ?? false,
      },
    }),
  );
  app.use(metrics);
  app.use(bodyParser.json({ limit: "800kb" }));

  const deps = await createAppDependencies(config);

  app.use(router);

  app.use(createSearchImmersionRouter(deps));

  // Those routes must be defined BEFORE the others
  app.use(createHelloWorldRouter());
  app.use(...createMagicLinkRouter(deps));
  app.use(...createAdminRouter(deps));
  app.use("/v1", createApiKeyAuthRouterV1(deps));
  app.use("/v2", createApiKeyAuthRouterV2(deps));
  app.use(...createInclusionConnectedAllowedRouter(deps));
  // ----
  app.use(createFormCompletionRouter(deps));
  app.use(createTechnicalRouter(deps, config.inboundEmailAllowedIps));
  app.use(createAddressRouter(deps));
  app.use(createConventionRouter(deps));
  app.use(createAgenciesRouter(deps));
  app.use(createPeConnectRouter(deps));
  app.use(createInclusionConnectRouter(deps));
  app.use(createApiKeyAuthRouter(deps));
  app.use(createValidateEmailRouter(deps));
  // Auth issues below this last router
  app.use(createEstablishmentRouter(deps));

  subscribeToEvents(deps);
  deps.eventCrawler.startCrawler();

  return {
    app,
    gateways: deps.gateways,
    eventCrawler: deps.eventCrawler,
    generateApiJwt: deps.generateApiJwt,
    generateConventionJwt: deps.generateConventionJwt,
    generateEditEstablishmentJwt: deps.generateEditEstablishmentJwt,
    generateAuthenticatedUserJwt: deps.generateAuthenticatedUserToken,
    generateBackOfficeJwt: deps.generateBackOfficeJwt,
    uuidGenerator: deps.uuidGenerator,
    inMemoryUow: deps.inMemoryUow,
  };
};

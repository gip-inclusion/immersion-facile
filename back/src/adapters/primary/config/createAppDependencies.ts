import { AbsoluteUrl, frontRoutes } from "shared";
import {
  makeGenerateJwtES256,
  makeGenerateJwtHS256,
} from "../../../domain/auth/jwt";
import { InMemoryEventBus } from "../../secondary/core/InMemoryEventBus";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { makeAdminAuthMiddleware } from "../adminAuthMiddleware";
import {
  createApiKeyAuthMiddlewareV0,
  makeApiKeyAuthMiddlewareV1,
  makeMagicLinkAuthMiddleware,
} from "../authMiddleware";
import {
  makeHandleManagedRedirectResponseError,
  makeHandleRawRedirectResponseError,
} from "../helpers/handleRedirectResponseError";
import { AppConfig } from "./appConfig";
import { createEventCrawler } from "./createEventCrawler";
import { createGateways, createGetPgPoolFn } from "./createGateways";
import { createGenerateConventionMagicLink } from "./createGenerateConventionMagicLink";
import { createUseCases } from "./createUseCases";
import { createUowPerformer } from "./uowConfig";

const uuidGenerator = new UuidV4Generator();

export type AppDependencies = ReturnType<
  typeof createAppDependencies
> extends Promise<infer T>
  ? T
  : never;

export const createAppDependencies = async (config: AppConfig) => {
  const getPgPoolFn = createGetPgPoolFn(config);
  const gateways = await createGateways(config);

  const { uowPerformer, inMemoryUow } = createUowPerformer(config, getPgPoolFn);

  const eventBus = new InMemoryEventBus(gateways.timeGateway, uowPerformer);
  const generateApiJwt = makeGenerateJwtES256(config.apiJwtPrivateKey);
  const generateMagicLinkJwt = makeGenerateJwtES256(
    config.magicLinkJwtPrivateKey,
  );
  const generateAdminJwt = makeGenerateJwtHS256(config.adminJwtSecret, "365d");
  const generateAuthenticatedUserToken = makeGenerateJwtES256(
    config.apiJwtPrivateKey,
    3600,
  );
  const generateMagicLinkFn = createGenerateConventionMagicLink(config);

  const redirectErrorUrl: AbsoluteUrl = `${config.immersionFacileBaseUrl}/${frontRoutes.error}`;
  const errorHandlers = {
    handleManagedRedirectResponseError:
      makeHandleManagedRedirectResponseError(redirectErrorUrl),
    handleRawRedirectResponseError:
      makeHandleRawRedirectResponseError(redirectErrorUrl),
  };

  const useCases = createUseCases(
    config,
    gateways,
    generateMagicLinkJwt,
    generateMagicLinkFn,
    generateAdminJwt,
    generateAuthenticatedUserToken,
    uowPerformer,
    uuidGenerator,
  );

  return {
    config,
    useCases,
    gateways,
    applicationMagicLinkAuthMiddleware: makeMagicLinkAuthMiddleware(
      config,
      "application",
    ),
    errorHandlers,
    establishmentMagicLinkAuthMiddleware: makeMagicLinkAuthMiddleware(
      config,
      "establishment",
    ),
    apiKeyAuthMiddlewareV0: createApiKeyAuthMiddlewareV0(
      useCases.getApiConsumerById.execute,
      gateways.timeGateway,
      config,
    ),
    apiKeyAuthMiddleware: makeApiKeyAuthMiddlewareV1(
      useCases.getApiConsumerById.execute,
      gateways.timeGateway,
      config,
    ),
    adminAuthMiddleware: await makeAdminAuthMiddleware(
      config.adminJwtSecret,
      gateways.timeGateway,
    ),
    generateMagicLinkJwt,
    generateApiJwt,
    generateAuthenticatedUserToken,
    eventBus,
    eventCrawler: createEventCrawler(config, uowPerformer, eventBus),
    uuidGenerator,
    inMemoryUow,
  };
};

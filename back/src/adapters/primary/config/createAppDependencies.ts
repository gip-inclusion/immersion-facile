import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { frontRoutes } from "shared/src/routes";
import {
  makeGenerateJwtES256,
  makeGenerateJwtHS256,
} from "../../../domain/auth/jwt";
import { RealClock } from "../../secondary/core/ClockImplementations";
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

const clock = new RealClock();
const uuidGenerator = new UuidV4Generator();

export type AppDependencies = ReturnType<
  typeof createAppDependencies
> extends Promise<infer T>
  ? T
  : never;

export const createAppDependencies = async (config: AppConfig) => {
  const getPgPoolFn = createGetPgPoolFn(config);
  const gateways = await createGateways(config, clock);

  const { uowPerformer, inMemoryUow } = createUowPerformer(config, getPgPoolFn);

  const eventBus = new InMemoryEventBus(clock, uowPerformer);
  const generateApiJwt = makeGenerateJwtES256(config.apiJwtPrivateKey);
  const generateMagicLinkJwt = makeGenerateJwtES256(
    config.magicLinkJwtPrivateKey,
  );
  const generateAdminJwt = makeGenerateJwtHS256(config.adminJwtSecret, "365d");
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
    uowPerformer,
    clock,
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
      clock,
      config,
    ),
    apiKeyAuthMiddleware: makeApiKeyAuthMiddlewareV1(
      useCases.getApiConsumerById.execute,
      clock,
      config,
    ),
    adminAuthMiddleware: await makeAdminAuthMiddleware(
      config.adminJwtSecret,
      clock,
    ),
    generateMagicLinkJwt,
    generateApiJwt,
    eventBus,
    eventCrawler: createEventCrawler(config, uowPerformer, eventBus),
    clock,
    inMemoryUow,
  };
};

import { AbsoluteUrl, frontRoutes } from "shared";
import { makeGenerateJwtES256 } from "../../../domain/auth/jwt";
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
  const generateApiJwt = makeGenerateJwtES256<"apiConsumer">(
    config.apiJwtPrivateKey,
    undefined, // no expiration
  );
  const oneHourInSeconds = 3600;
  const oneDayInSecond = oneHourInSeconds * 24;
  const onYearInSeconds = oneDayInSecond * 365;
  const thirtyDaysInSecond = oneDayInSecond * 30;

  const generateEditEstablishmentJwt =
    makeGenerateJwtES256<"editEstablishment">(
      config.jwtPrivateKey,
      oneDayInSecond,
    );

  const generateBackOfficeJwt = makeGenerateJwtES256<"backOffice">(
    config.jwtPrivateKey,
    onYearInSeconds,
  );

  const generateAuthenticatedUserToken =
    makeGenerateJwtES256<"authenticatedUser">(
      config.jwtPrivateKey,
      oneHourInSeconds,
    );

  const generateConventionJwt = makeGenerateJwtES256<"convention">(
    config.jwtPrivateKey,
    thirtyDaysInSecond,
  );

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
    generateConventionJwt,
    generateEditEstablishmentJwt,
    generateBackOfficeJwt,
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
      "convention",
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
      config.jwtPublicKey,
      gateways.timeGateway,
    ),
    generateEditEstablishmentJwt,
    generateConventionJwt,
    generateApiJwt,
    generateAuthenticatedUserToken,
    generateBackOfficeJwt,
    eventBus,
    eventCrawler: createEventCrawler(config, uowPerformer, eventBus),
    uuidGenerator,
    inMemoryUow,
    uowPerformer,
    getPgPoolFn,
  };
};

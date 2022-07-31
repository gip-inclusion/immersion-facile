import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import supertest from "supertest";
import { AppConfig } from "../adapters/primary/config/appConfig";
import { Gateways } from "../adapters/primary/config/createGateways";
import { InMemoryUnitOfWork } from "../adapters/primary/config/uowConfig";
import { createApp } from "../adapters/primary/server";
import { BasicEventCrawler } from "../adapters/secondary/core/EventCrawlerImplementations";
import type { InMemoryEmailGateway } from "../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryAddressAPI } from "../adapters/secondary/immersionOffer/InMemoryAddressAPI";
import { InMemoryLaBonneBoiteAPI } from "../adapters/secondary/immersionOffer/InMemoryLaBonneBoiteAPI";
import { InMemoryPassEmploiGateway } from "../adapters/secondary/immersionOffer/InMemoryPassEmploiGateway";
import { InMemoryDocumentGateway } from "../adapters/secondary/InMemoryDocumentGateway";
import { InMemoryPeConnectGateway } from "../adapters/secondary/PeConnectGateway/InMemoryPeConnectGateway";
import { InMemoryPoleEmploiGateway } from "../adapters/secondary/InMemoryPoleEmploiGateway";
import { InMemorySireneGateway } from "../adapters/secondary/InMemorySireneGateway";
import { InMemoryReportingGateway } from "../adapters/secondary/reporting/InMemoryReportingGateway";
import {
  GenerateApiConsumerJtw,
  GenerateMagicLinkJwt,
} from "../domain/auth/jwt";
import { Clock } from "../domain/core/ports/Clock";
import { GetFeatureFlags } from "../domain/core/ports/GetFeatureFlags";
import { AppConfigBuilder } from "./AppConfigBuilder";

export type InMemoryGateways = {
  email: InMemoryEmailGateway;
  peConnectGateway: InMemoryPeConnectGateway;
  sirene: InMemorySireneGateway;
  laBonneBoiteAPI: InMemoryLaBonneBoiteAPI;
  passEmploiGateway: InMemoryPassEmploiGateway;
  poleEmploiGateway: InMemoryPoleEmploiGateway;
  getFeatureFlags: GetFeatureFlags;
  documentGateway: InMemoryDocumentGateway;
  reportingGateway: InMemoryReportingGateway;
  addressApi: InMemoryAddressAPI;
};

// following function only to type check that InMemoryRepositories is assignable to Repositories :
// prettier-ignore
const _isAssignable = (inMemoryRepos: InMemoryGateways): Gateways => inMemoryRepos;

export type TestAppAndDeps = {
  request: supertest.SuperTest<supertest.Test>;
  gateways: InMemoryGateways;
  eventCrawler: BasicEventCrawler;
  appConfig: AppConfig;
  generateApiJwt: GenerateApiConsumerJtw;
  generateMagicLinkJwt: GenerateMagicLinkJwt;
  clock: Clock;
  inMemoryUow: InMemoryUnitOfWork;
};

export const buildTestApp = async (
  appConfigOverrides?: AppConfig,
): Promise<TestAppAndDeps> => {
  const adminEmail = "admin@email.fr";
  const validConvention = new ConventionDtoBuilder().build();
  const agency = AgencyDtoBuilder.create(validConvention.agencyId)
    .withName("TEST-name")
    .withAdminEmails([adminEmail])
    .withQuestionnaireUrl("TEST-questionnaireUrl")
    .withSignature("TEST-signature")
    .build();

  const appConfig = new AppConfigBuilder({
    ENABLE_ENTERPRISE_SIGNATURE: "TRUE",
    SKIP_EMAIL_ALLOW_LIST: "TRUE",
    EMAIL_GATEWAY: "IN_MEMORY",
    SIRENE_REPOSITORY: "IN_MEMORY",
    DOMAIN: "my-domain",
    REPOSITORIES: "IN_MEMORY",
    LA_BONNE_BOITE_GATEWAY: "IN_MEMORY",
    PASS_EMPLOI_GATEWAY: "IN_MEMORY",
    PE_CONNECT_GATEWAY: "IN_MEMORY",
    EVENT_CRAWLER_PERIOD_MS: "0", // will not crawl automatically
    REPORTING_GATEWAY: "EXCEL",
    ADDRESS_API_GATEWAY: "IN_MEMORY",
    ...appConfigOverrides?.configParams,
  }).build();

  if (appConfig.emailGateway !== "IN_MEMORY") throwNotSupportedError();
  if (appConfig.repositories !== "IN_MEMORY") throwNotSupportedError();
  if (appConfig.sireneGateway !== "IN_MEMORY") throwNotSupportedError();

  const {
    app,
    gateways,
    eventCrawler: rawEventCrawler,
    generateApiJwt,
    generateMagicLinkJwt,
    clock,
    inMemoryUow: uow,
  } = await createApp(appConfig);

  const request = supertest(app);
  const eventCrawler = rawEventCrawler as BasicEventCrawler;

  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
  const inMemoryUow = uow!;

  await inMemoryUow.agencyRepository.insert(agency);

  return {
    request,
    gateways: gateways as InMemoryGateways,
    eventCrawler,
    appConfig,
    generateApiJwt,
    generateMagicLinkJwt,
    clock,
    inMemoryUow,
  };
};

const throwNotSupportedError = () => {
  throw new Error("AppConfig not supported.");
};

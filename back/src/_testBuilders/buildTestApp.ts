import supertest from "supertest";
import { AgencyDtoBuilder, ConventionDtoBuilder } from "shared";
import { AppConfig } from "../adapters/primary/config/appConfig";
import { Gateways } from "../adapters/primary/config/createGateways";
import { InMemoryUnitOfWork } from "../adapters/primary/config/uowConfig";
import { createApp } from "../adapters/primary/server";
import { InMemoryAddressGateway } from "../adapters/secondary/addressGateway/InMemoryAddressGateway";
import { BasicEventCrawler } from "../adapters/secondary/core/EventCrawlerImplementations";
import { CustomTimeGateway } from "../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { StubDashboardGateway } from "../adapters/secondary/dashboardGateway/StubDashboardGateway";
import type { InMemoryEmailGateway } from "../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryEmailValidationGateway } from "../adapters/secondary/emailValidationGateway/InMemoryEmailValidationStatusGateway";
import { InMemoryLaBonneBoiteAPI } from "../adapters/secondary/immersionOffer/laBonneBoite/InMemoryLaBonneBoiteAPI";
import { InMemoryPassEmploiGateway } from "../adapters/secondary/immersionOffer/passEmploi/InMemoryPassEmploiGateway";
import { InMemoryPoleEmploiGateway } from "../adapters/secondary/immersionOffer/poleEmploi/InMemoryPoleEmploiGateway";
import { InMemoryInclusionConnectGateway } from "../adapters/secondary/InclusionConnectGateway/InMemoryInclusionConnectGateway";
import { NotImplementedDocumentGateway } from "../adapters/secondary/NotImplementedDocumentGateway";
import { InMemoryPeConnectGateway } from "../adapters/secondary/PeConnectGateway/InMemoryPeConnectGateway";
import { InMemoryExportGateway } from "../adapters/secondary/reporting/InMemoryExportGateway";
import { DeterministShortLinkGenerator } from "../adapters/secondary/shortLinkGenerator/DeterministShortLinkGenerator";
import { InMemorySirenGateway } from "../adapters/secondary/sirene/InMemorySirenGateway";
import {
  GenerateApiConsumerJwt,
  GenerateAuthenticatedUserJwt,
  GenerateBackOfficeJwt,
  GenerateConventionJwt,
  GenerateEditFormEstablishmentJwt,
} from "../domain/auth/jwt";
import { UuidGenerator } from "../domain/core/ports/UuidGenerator";
import { AppConfigBuilder } from "./AppConfigBuilder";

export type InMemoryGateways = {
  email: InMemoryEmailGateway;
  peConnectGateway: InMemoryPeConnectGateway;
  siren: InMemorySirenGateway;
  laBonneBoiteAPI: InMemoryLaBonneBoiteAPI;
  passEmploiGateway: InMemoryPassEmploiGateway;
  poleEmploiGateway: InMemoryPoleEmploiGateway;
  inclusionConnectGateway: InMemoryInclusionConnectGateway;
  documentGateway: NotImplementedDocumentGateway;
  dashboardGateway: StubDashboardGateway;
  addressApi: InMemoryAddressGateway;
  exportGateway: InMemoryExportGateway;
  timeGateway: CustomTimeGateway;
  emailValidationGateway: InMemoryEmailValidationGateway;
  shortLinkGenerator: DeterministShortLinkGenerator;
};

// following function only to type check that InMemoryRepositories is assignable to Repositories :
// prettier-ignore
const _isAssignable = (inMemoryRepos: InMemoryGateways): Gateways => inMemoryRepos;

export type TestAppAndDeps = {
  request: supertest.SuperTest<supertest.Test>;
  gateways: InMemoryGateways;
  eventCrawler: BasicEventCrawler;
  appConfig: AppConfig;
  generateApiJwt: GenerateApiConsumerJwt;
  generateEditEstablishmentJwt: GenerateEditFormEstablishmentJwt;
  generateConventionJwt: GenerateConventionJwt;
  generateAuthenticatedUserJwt: GenerateAuthenticatedUserJwt;
  generateBackOfficeJwt: GenerateBackOfficeJwt;
  uuidGenerator: UuidGenerator;
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
    ADDRESS_API_GATEWAY: "IN_MEMORY",
    EVENT_CRAWLER_PERIOD_MS: "0", // will not crawl automatically
    DOMAIN: "my-domain",
    EMAIL_GATEWAY: "IN_MEMORY",
    ENABLE_ENTERPRISE_SIGNATURE: "TRUE",
    INCLUSION_CONNECT_GATEWAY: "IN_MEMORY",
    LA_BONNE_BOITE_GATEWAY: "IN_MEMORY",
    PASS_EMPLOI_GATEWAY: "IN_MEMORY",
    PE_CONNECT_GATEWAY: "IN_MEMORY",
    REPORTING_GATEWAY: "EXCEL",
    REPOSITORIES: "IN_MEMORY",
    SKIP_EMAIL_ALLOW_LIST: "TRUE",
    SIRENE_REPOSITORY: "IN_MEMORY",
    TIME_GATEWAY: "CUSTOM",
    EMAIL_VALIDATION_GATEWAY: "IN_MEMORY",
    SHORT_LINK_GENERATOR: "DETERMINIST",
    ...appConfigOverrides?.configParams,
  }).build();

  if (appConfig.shortLinkGenerator !== "DETERMINIST") throwNotSupportedError();
  if (appConfig.emailGateway !== "IN_MEMORY") throwNotSupportedError();
  if (appConfig.repositories !== "IN_MEMORY") throwNotSupportedError();
  if (appConfig.sirenGateway !== "IN_MEMORY") throwNotSupportedError();
  if (appConfig.timeGateway !== "CUSTOM") throwNotSupportedError();

  const {
    app,
    gateways,
    eventCrawler: rawEventCrawler,
    generateApiJwt,
    generateConventionJwt,
    generateEditEstablishmentJwt,
    generateAuthenticatedUserJwt,
    generateBackOfficeJwt,
    uuidGenerator,
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
    generateConventionJwt,
    generateEditEstablishmentJwt,
    generateAuthenticatedUserJwt,
    generateBackOfficeJwt,
    uuidGenerator,
    inMemoryUow,
  };
};

const throwNotSupportedError = () => {
  throw new Error("AppConfig not supported.");
};

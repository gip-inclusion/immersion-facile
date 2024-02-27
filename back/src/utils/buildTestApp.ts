import { AgencyDtoBuilder, ConventionDtoBuilder } from "shared";
import supertest from "supertest";
import { AppConfig } from "../adapters/primary/config/appConfig";
import { Gateways } from "../adapters/primary/config/createGateways";
import { InMemoryUnitOfWork } from "../adapters/primary/config/uowConfig";
import { createApp } from "../adapters/primary/server";
import { InMemoryInclusionConnectGateway } from "../adapters/secondary/InclusionConnectGateway/InMemoryInclusionConnectGateway";
import { InMemoryPeConnectGateway } from "../adapters/secondary/PeConnectGateway/InMemoryPeConnectGateway";
import { BasicEventCrawler } from "../adapters/secondary/core/EventCrawlerImplementations";
import { StubDashboardGateway } from "../adapters/secondary/dashboardGateway/StubDashboardGateway";
import { NotImplementedDocumentGateway } from "../adapters/secondary/documentGateway/NotImplementedDocumentGateway";
import { InMemoryEmailValidationGateway } from "../adapters/secondary/emailValidationGateway/InMemoryEmailValidationGateway";
import type { InMemoryNotificationGateway } from "../adapters/secondary/notificationGateway/InMemoryNotificationGateway";
import { InMemoryLaBonneBoiteGateway } from "../adapters/secondary/offer/laBonneBoite/InMemoryLaBonneBoiteGateway";
import { InMemoryPassEmploiGateway } from "../adapters/secondary/offer/passEmploi/InMemoryPassEmploiGateway";
import { InMemoryPdfGeneratorGateway } from "../adapters/secondary/pdfGeneratorGateway/InMemoryPdfGeneratorGateway";
import { InMemoryPoleEmploiGateway } from "../adapters/secondary/poleEmploi/InMemoryPoleEmploiGateway";
import { DeterministShortLinkIdGeneratorGateway } from "../adapters/secondary/shortLinkIdGeneratorGateway/DeterministShortLinkIdGeneratorGateway";
import { InMemorySiretGateway } from "../adapters/secondary/siret/InMemorySiretGateway";
import { InMemorySubscribersGateway } from "../adapters/secondary/subscribersGateway/InMemorySubscribersGateway";
import {
  GenerateApiConsumerJwt,
  GenerateBackOfficeJwt,
  GenerateConventionJwt,
  GenerateEditFormEstablishmentJwt,
  GenerateInclusionConnectJwt,
} from "../domain/auth/jwt";
import { InMemoryAddressGateway } from "../domain/core/address/adapters/InMemoryAddressGateway";
import { CustomTimeGateway } from "../domain/core/time-gateway/adapters/CustomTimeGateway";
import { UuidGenerator } from "../domain/core/uuid-generator/ports/UuidGenerator";
import { AppConfigBuilder } from "./AppConfigBuilder";

export type InMemoryGateways = {
  notification: InMemoryNotificationGateway;
  peConnectGateway: InMemoryPeConnectGateway;
  siret: InMemorySiretGateway;
  pdfGeneratorGateway: InMemoryPdfGeneratorGateway;
  laBonneBoiteGateway: InMemoryLaBonneBoiteGateway;
  passEmploiGateway: InMemoryPassEmploiGateway;
  poleEmploiGateway: InMemoryPoleEmploiGateway;
  inclusionConnectGateway: InMemoryInclusionConnectGateway;
  documentGateway: NotImplementedDocumentGateway;
  dashboardGateway: StubDashboardGateway;
  addressApi: InMemoryAddressGateway;
  timeGateway: CustomTimeGateway;
  emailValidationGateway: InMemoryEmailValidationGateway;
  shortLinkGenerator: DeterministShortLinkIdGeneratorGateway;
  subscribersGateway: InMemorySubscribersGateway;
};

// following function only to type check that InMemoryRepositories is assignable to Repositories :
// prettier-ignore
const _isAssignable = (inMemoryRepos: InMemoryGateways): Gateways =>
  inMemoryRepos;

export type TestAppAndDeps = {
  request: supertest.SuperTest<supertest.Test>;
  gateways: InMemoryGateways;
  eventCrawler: BasicEventCrawler;
  appConfig: AppConfig;
  generateApiConsumerJwt: GenerateApiConsumerJwt;
  generateEditEstablishmentJwt: GenerateEditFormEstablishmentJwt;
  generateConventionJwt: GenerateConventionJwt;
  generateInclusionConnectJwt: GenerateInclusionConnectJwt;
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
    .withQuestionnaireUrl("https://TEST-questionnaireUrl")
    .withSignature("TEST-signature")
    .build();

  const appConfig = new AppConfigBuilder({
    ADDRESS_API_GATEWAY: "IN_MEMORY",
    EVENT_CRAWLER_PERIOD_MS: "0", // will not crawl automatically
    DOMAIN: "my-domain",
    NOTIFICATION_GATEWAY: "IN_MEMORY",
    ENABLE_ENTERPRISE_SIGNATURE: "TRUE",
    INCLUSION_CONNECT_GATEWAY: "IN_MEMORY",
    LA_BONNE_BOITE_GATEWAY: "IN_MEMORY",
    PASS_EMPLOI_GATEWAY: "IN_MEMORY",
    PE_CONNECT_GATEWAY: "IN_MEMORY",
    PDF_GENERATOR_GATEWAY: "IN_MEMORY",
    REPORTING_GATEWAY: "EXCEL",
    REPOSITORIES: "IN_MEMORY",
    SKIP_EMAIL_ALLOW_LIST: "TRUE",
    SIRENE_REPOSITORY: "IN_MEMORY",
    TIME_GATEWAY: "CUSTOM",
    EMAIL_VALIDATION_GATEWAY: "IN_MEMORY",
    SHORT_LINK_ID_GENERATOR_GATEWAY: "DETERMINIST",
    INBOUND_EMAIL_ALLOWED_IPS: "::ffff:127.0.0.1",
    MAX_API_CONSUMER_CALLS_PER_SECOND: "2",
    ...appConfigOverrides?.configParams,
  }).build();

  if (appConfig.shortLinkIdGeneratorGateway !== "DETERMINIST")
    throwNotSupportedError();
  if (appConfig.notificationGateway !== "IN_MEMORY") throwNotSupportedError();
  if (appConfig.repositories !== "IN_MEMORY") throwNotSupportedError();
  if (appConfig.siretGateway !== "IN_MEMORY") throwNotSupportedError();
  if (appConfig.timeGateway !== "CUSTOM") throwNotSupportedError();

  const {
    app,
    gateways,
    eventCrawler: rawEventCrawler,
    generateApiConsumerJwt,
    generateConventionJwt,
    generateEditEstablishmentJwt,
    generateInclusionConnectJwt,
    generateBackOfficeJwt,
    uuidGenerator,
    inMemoryUow: uow,
  } = await createApp(appConfig);

  const request = supertest(app);
  const eventCrawler = rawEventCrawler as BasicEventCrawler;

  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  const inMemoryUow = uow!;

  await inMemoryUow.agencyRepository.insert(agency);

  return {
    request,
    gateways: gateways as InMemoryGateways,
    eventCrawler,
    appConfig,
    generateApiConsumerJwt,
    generateConventionJwt,
    generateEditEstablishmentJwt,
    generateInclusionConnectJwt,
    generateBackOfficeJwt,
    uuidGenerator,
    inMemoryUow,
  };
};

const throwNotSupportedError = () => {
  throw new Error("AppConfig not supported.");
};

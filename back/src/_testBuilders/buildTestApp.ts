import supertest from "supertest";
import { AppConfig } from "../adapters/primary/config/appConfig";
import { Repositories } from "../adapters/primary/config/repositoriesConfig";
import { createApp } from "../adapters/primary/server";
import { BasicEventCrawler } from "../adapters/secondary/core/EventCrawlerImplementations";
import type { InMemoryOutboxRepository } from "../adapters/secondary/core/InMemoryOutboxRepository";
import { InMemoryEstablishmentAggregateRepository } from "../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryLaBonneBoiteAPI } from "../adapters/secondary/immersionOffer/InMemoryLaBonneBoiteAPI";
import { InMemorySearchMadeRepository } from "../adapters/secondary/immersionOffer/InMemorySearchMadeRepository";
import { InMemoryLaBonneBoiteRequestRepository } from "../adapters/secondary/immersionOffer/InMemoryLaBonneBoiteRequestRepository";
import type { InMemoryAgencyRepository } from "../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryDocumentGateway } from "../adapters/secondary/InMemoryDocumentGateway";
import type { InMemoryEmailGateway } from "../adapters/secondary/InMemoryEmailGateway";
import { InMemoryFormEstablishmentRepository } from "../adapters/secondary/InMemoryFormEstablishmentRepository";
import type { InMemoryImmersionApplicationRepository } from "../adapters/secondary/InMemoryImmersionApplicationRepository";
import { InMemoryPeConnectGateway } from "../adapters/secondary/InMemoryPeConnectGateway";
import { InMemoryRomeRepository } from "../adapters/secondary/InMemoryRomeRepository";
import { InMemorySireneGateway } from "../adapters/secondary/InMemorySireneGateway";
import { GetApiConsumerById } from "../domain/core/ports/GetApiConsumerById";
import { GetFeatureFlags } from "../domain/core/ports/GetFeatureFlags";
import { AgencyConfigBuilder } from "./AgencyConfigBuilder";
import { AppConfigBuilder } from "./AppConfigBuilder";
import { ImmersionApplicationDtoBuilder } from "./ImmersionApplicationDtoBuilder";
import { EstablishmentExportQueries } from "../domain/establishment/ports/EstablishmentExportQueries";
import { PostalCodeDepartmentRegionQueries } from "../domain/generic/geo/ports/PostalCodeDepartmentRegionQueries";
import {
  GenerateApiConsumerJtw,
  GenerateMagicLinkJwt,
} from "../domain/auth/jwt";
import { InMemoryOutboxQueries } from "../adapters/secondary/core/InMemoryOutboxQueries";
import { InMemoryPassEmploiGateway } from "../adapters/secondary/immersionOffer/InMemoryPassEmploiGateway";
import { InMemoryReportingGateway } from "../adapters/secondary/reporting/InMemoryReportingGateway";
import { InMemoryImmersionApplicationQueries } from "../adapters/secondary/InMemoryImmersionApplicationQueries";

export type InMemoryRepositories = {
  conventionPoleEmploiAdvisor: InMemoryConventionPoleEmploiAdvisorRepository;
  outbox: InMemoryOutboxRepository;
  outboxQueries: InMemoryOutboxQueries;
  immersionOffer: InMemoryEstablishmentAggregateRepository;
  agency: InMemoryAgencyRepository;
  formEstablishment: InMemoryFormEstablishmentRepository;
  immersionApplication: InMemoryImmersionApplicationRepository;
  immersionApplicationQueries: InMemoryImmersionApplicationQueries;
  searchesMade: InMemorySearchMadeRepository;
  rome: InMemoryRomeRepository;
  email: InMemoryEmailGateway;
  peConnectGateway: InMemoryPeConnectGateway;
  sirene: InMemorySireneGateway;
  laBonneBoiteAPI: InMemoryLaBonneBoiteAPI;
  laBonneBoiteRequest: InMemoryLaBonneBoiteRequestRepository;
  passEmploiGateway: InMemoryPassEmploiGateway;
  establishmentExport: EstablishmentExportQueries;
  postalCodeDepartmentRegion: PostalCodeDepartmentRegionQueries;
  getApiConsumerById: GetApiConsumerById;
  getFeatureFlags: GetFeatureFlags;
  documentGateway: InMemoryDocumentGateway;
  reportingGateway: InMemoryReportingGateway;
};

// following function only to type check that InMemoryRepositories is assignable to Repositories :
// prettier-ignore
const _isAssignable = (inMemoryRepos: InMemoryRepositories): Repositories => inMemoryRepos;

export type TestAppAndDeps = {
  request: supertest.SuperTest<supertest.Test>;
  reposAndGateways: InMemoryRepositories;
  eventCrawler: BasicEventCrawler;
  appConfig: AppConfig;
  generateApiJwt: GenerateApiConsumerJtw;
  generateMagicLinkJwt: GenerateMagicLinkJwt;
};

export const buildTestApp = async (
  appConfigOverrides?: AppConfig,
): Promise<TestAppAndDeps> => {
  const adminEmail = "admin@email.fr";
  const validImmersionApplication =
    new ImmersionApplicationDtoBuilder().build();
  const agencyConfig = AgencyConfigBuilder.create(
    validImmersionApplication.agencyId,
  )
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
    EVENT_CRAWLER_PERIOD_MS: "0", // will not crawl automatically
    REPORTING_GATEWAY: "EXCEL",
    ...appConfigOverrides?.configParams,
  }).build();

  if (appConfig.emailGateway !== "IN_MEMORY") throwNotSupportedError();
  if (appConfig.repositories !== "IN_MEMORY") throwNotSupportedError();
  if (appConfig.sireneGateway !== "IN_MEMORY") throwNotSupportedError();

  const {
    app,
    repositories,
    eventCrawler: rawEventCrawler,
    generateApiJwt,
    generateMagicLinkJwt,
  } = await createApp(appConfig);

  const request = supertest(app);
  const eventCrawler = rawEventCrawler as BasicEventCrawler;
  const reposAndGateways = repositories as InMemoryRepositories;

  await reposAndGateways.agency.insert(agencyConfig);

  return {
    request,
    reposAndGateways,
    eventCrawler,
    appConfig,
    generateApiJwt,
    generateMagicLinkJwt,
  };
};

const throwNotSupportedError = () => {
  throw new Error("AppConfig not supported.");
};

import supertest from "supertest";
import type { Repositories } from "../adapters/primary/config";
import { createApp } from "../adapters/primary/server";
import type { InMemoryOutboxRepository } from "../adapters/secondary/core/InMemoryOutboxRepository";
import { InMemoryImmersionOfferRepository } from "../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemorySearchesMadeRepository } from "../adapters/secondary/immersionOffer/InMemorySearchesMadeRepository";
import type { InMemoryAgencyRepository } from "../adapters/secondary/InMemoryAgencyRepository";
import type { InMemoryEmailGateway } from "../adapters/secondary/InMemoryEmailGateway";
import { InMemoryFormEstablishmentRepository } from "../adapters/secondary/InMemoryFormEstablishmentRepository";
import type { InMemoryImmersionApplicationRepository } from "../adapters/secondary/InMemoryImmersionApplicationRepository";
import { BasicEventCrawler } from "../adapters/secondary/core/EventCrawlerImplementations";
import { InMemoryRomeGateway } from "../adapters/secondary/InMemoryRomeGateway";
import { InMemorySireneRepository } from "../adapters/secondary/InMemorySireneRepository";
import { AgencyConfigBuilder } from "./AgencyConfigBuilder";
import { AppConfigBuilder } from "./AppConfigBuilder";
import { ImmersionApplicationDtoBuilder } from "./ImmersionApplicationDtoBuilder";

export type InMemoryRepositories = {
  outbox: InMemoryOutboxRepository;
  immersionOffer: InMemoryImmersionOfferRepository;
  agency: InMemoryAgencyRepository;
  formEstablishment: InMemoryFormEstablishmentRepository;
  demandeImmersion: InMemoryImmersionApplicationRepository;
  searchesMade: InMemorySearchesMadeRepository;
  rome: InMemoryRomeGateway;
  email: InMemoryEmailGateway;
  sirene: InMemorySireneRepository;
};

// following function only to type check that InMemoryRepositories is assignable to Repositories :
// prettier-ignore
const isAssignable = (inMemoryRepos: InMemoryRepositories): Repositories => inMemoryRepos;

type TestAppAndDeps = {
  request: supertest.SuperTest<supertest.Test>;
  reposAndGateways: InMemoryRepositories;
  eventCrawler: BasicEventCrawler;
};

export const buildTestApp = async (): Promise<TestAppAndDeps> => {
  const adminEmail = "admin@email.fr";
  const validDemandeImmersion = new ImmersionApplicationDtoBuilder().build();
  const agencyConfig = AgencyConfigBuilder.create(
    validDemandeImmersion.agencyId,
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
    EVENT_CRAWLER_PERIOD_MS: "0", // will not crawl automatically
  }).build();

  const {
    app,
    repositories,
    eventCrawler: rawEventCrawler,
  } = await createApp(appConfig);

  const request = supertest(app);
  const eventCrawler = rawEventCrawler as BasicEventCrawler;
  const reposAndGateways = repositories as InMemoryRepositories;

  await reposAndGateways.agency.insert(agencyConfig);

  return {
    request,
    reposAndGateways,
    eventCrawler,
  };
};

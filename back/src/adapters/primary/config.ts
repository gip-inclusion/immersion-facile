import { Client, Pool } from "pg";
import { NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification } from "./../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import { ALWAYS_REJECT } from "../../domain/auth/AuthChecker";
import { InMemoryAuthChecker } from "../../domain/auth/InMemoryAuthChecker";
import { GenerateJwtFn, makeGenerateJwt } from "../../domain/auth/jwt";
import {
  EventBus,
  makeCreateNewEvent,
} from "../../domain/core/eventBus/EventBus";
import { EventCrawler } from "../../domain/core/eventBus/EventCrawler";
import { OutboxRepository } from "../../domain/core/ports/OutboxRepository";
import { ImmersionApplicationRepository } from "../../domain/immersionApplication/ports/ImmersionApplicationRepository";
import {
  AddImmersionApplication,
  AddImmersionApplicationML,
} from "../../domain/immersionApplication/useCases/AddImmersionApplication";
import { GetImmersionApplication } from "../../domain/immersionApplication/useCases/GetImmersionApplication";
import { ListImmersionApplication } from "../../domain/immersionApplication/useCases/ListImmersionApplication";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmitted } from "../../domain/immersionApplication/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmitted";
import { ConfirmToMentorThatApplicationCorrectlySubmitted } from "../../domain/immersionApplication/useCases/notifications/ConfirmToMentorThatApplicationCorrectlySubmitted";
import { NotifyAllActorsOfFinalApplicationValidation } from "../../domain/immersionApplication/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";
import { NotifyNewApplicationNeedsReview } from "../../domain/immersionApplication/useCases/notifications/NotifyNewApplicationNeedsReview";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../domain/immersionApplication/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { UpdateImmersionApplication } from "../../domain/immersionApplication/useCases/UpdateImmersionApplication";
import { UpdateImmersionApplicationStatus } from "../../domain/immersionApplication/useCases/UpdateImmersionApplicationStatus";
import { GenerateMagicLink } from "../../domain/immersionApplication/useCases/GenerateMagicLink";
import { ValidateImmersionApplication } from "../../domain/immersionApplication/useCases/ValidateImmersionApplication";
import { AddImmersionOffer } from "../../domain/immersionOffer/useCases/AddImmersionOffer";
import { RomeSearch } from "../../domain/rome/useCases/RomeSearch";
import { SearchImmersion } from "../../domain/searchImmersion/useCases/SearchImmersion";
import { GetSiret } from "../../domain/sirene/useCases/GetSiret";
import { ImmersionApplicationId } from "../../shared/ImmersionApplicationDto";
import {
  createMagicLinkPayload,
  Role,
} from "../../shared/tokens/MagicLinkPayload";
import { createLogger } from "../../utils/logger";
import {
  genericApplicationDataConverter,
  legacyApplicationDataConverter,
} from "../secondary/AirtableApplicationDataConverters";
import { AirtableDemandeImmersionRepository } from "../secondary/AirtableDemandeImmersionRepository";
import {
  AirtableImmersionOfferRepository,
  immersionOfferDataConverter,
} from "../secondary/AirtableImmersionOfferRepositroy";
import {
  ApplicationRepositoryMap,
  ApplicationRepositorySwitcher,
} from "../secondary/ApplicationRepositorySwitcher";
import { CachingAccessTokenGateway } from "../secondary/core/CachingAccessTokenGateway";
import { RealClock } from "../secondary/core/ClockImplementations";
import {
  BasicEventCrawler,
  RealEventCrawler,
} from "../secondary/core/EventCrawlerImplementations";
import { InMemoryOutboxRepository } from "../secondary/core/InMemoryOutboxRepository";
import { UuidV4Generator } from "../secondary/core/UuidGeneratorImplementations";
import { HttpsSireneRepository } from "../secondary/HttpsSireneRepository";
import {
  createAgencyConfigsFromAppConfig,
  InMemoryAgencyRepository,
} from "../secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../secondary/InMemoryEmailGateway";
import { InMemoryEventBus } from "../secondary/InMemoryEventBus";
import { InMemoryImmersionApplicationRepository } from "../secondary/InMemoryImmersionApplicationRepository";
import { InMemoryImmersionOfferRepository } from "../secondary/InMemoryImmersionOfferRepository";
import { InMemoryRomeGateway } from "../secondary/InMemoryRomeGateway";
import { InMemorySireneRepository } from "../secondary/InMemorySireneRepository";
import { PgImmersionApplicationRepository } from "../secondary/pg/PgImmersionApplicationRepository";
import { PoleEmploiAccessTokenGateway } from "../secondary/PoleEmploiAccessTokenGateway";
import { PoleEmploiRomeGateway } from "../secondary/PoleEmploiRomeGateway";
import { InMemoryImmersionOfferRepository as InMemoryImmersionOfferRepositoryForSearch } from "../secondary/searchImmersion/InMemoryImmersonOfferRepository";
import { PgImmersionOfferRepository as PgImmersionOfferRepositoryForSearch } from "../secondary/searchImmersion/PgImmersionOfferRepository";
import { SendinblueEmailGateway } from "../secondary/SendinblueEmailGateway";
import { AppConfig } from "./appConfig";
import { createAuthMiddleware } from "./authMiddleware";

const logger = createLogger(__filename);

const clock = new RealClock();
const uuidGenerator = new UuidV4Generator();

export const createAppDependencies = async (config: AppConfig) => {
  const repositories = await createRepositories(config);
  const eventBus = createEventBus();
  const generateJwtFn = createGenerateJwtFn(config);
  const generateMagicLinkFn = createGenerateVerificationMagicLink(config);

  return {
    useCases: createUseCases(
      config,
      repositories,
      generateJwtFn,
      generateMagicLinkFn,
    ),
    authChecker: createAuthChecker(config),
    authMiddleware: createAuthMiddleware(config),
    generateJwtFn,
    eventBus,
    eventCrawler: createEventCrawler(config, repositories.outbox, eventBus),
  };
};

export type AppDependencies = ReturnType<
  typeof createAppDependencies
> extends Promise<infer T>
  ? T
  : never;

const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

const createApplicationRepository = async (config: AppConfig) => {
  switch (config.repositories) {
    case "AIRTABLE":
      return AirtableDemandeImmersionRepository.create(
        config.airtableGenericImmersionApplicationTableConfig,
        genericApplicationDataConverter,
      );
    case "PG": {
      const pool = new Pool({ connectionString: config.pgImmersionDbUrl });
      const client = await pool.connect();
      return new PgImmersionApplicationRepository(client);
    }
    default:
      return new InMemoryImmersionApplicationRepository();
  }
};

// prettier-ignore
type Repositories = ReturnType<typeof createRepositories> extends Promise<
  infer T
>
  ? T
  : never;

const createRepositories = async (config: AppConfig) => {
  logger.info({
    repositories: config.repositories,
    sireneRepository: config.sireneRepository,
    emailGateway: config.emailGateway,
    romeGateway: config.romeGateway,
  });

  return {
    demandeImmersion: await createApplicationRepository(config),
    immersionOffer:
      config.repositories === "IN_MEMORY"
        ? new InMemoryImmersionOfferRepository()
        : AirtableImmersionOfferRepository.create(
            config.airtableApplicationTableConfig,
            immersionOfferDataConverter,
          ),

    immersionOfferForSearch:
      config.repositories === "PG"
        ? new PgImmersionOfferRepositoryForSearch(
            // TODO: Revisit how to properly use the postgres connection pool.
            // Details in https://node-postgres.com/features/pooling
            new Client(config.pgImmersionDbUrl),
          )
        : new InMemoryImmersionOfferRepositoryForSearch(),

    agency: new InMemoryAgencyRepository(
      createAgencyConfigsFromAppConfig(config),
    ),

    sirene:
      config.sireneRepository === "HTTPS"
        ? HttpsSireneRepository.create(config.sireneHttpsConfig)
        : new InMemorySireneRepository(),

    email:
      config.emailGateway === "SENDINBLUE"
        ? SendinblueEmailGateway.create(config.sendinblueApiKey)
        : new InMemoryEmailGateway(),

    rome:
      config.romeGateway === "POLE_EMPLOI"
        ? new PoleEmploiRomeGateway(
            new CachingAccessTokenGateway(
              new PoleEmploiAccessTokenGateway(
                config.poleEmploiAccessTokenConfig,
              ),
            ),
            config.poleEmploiClientId,
          )
        : new InMemoryRomeGateway(),

    outbox: new InMemoryOutboxRepository(),
  };
};

export const createAuthChecker = (config: AppConfig) => {
  if (!config.backofficeUsername || !config.backofficePassword) {
    logger.warn("Missing backoffice credentials. Disabling backoffice access.");
    return ALWAYS_REJECT;
  }
  return InMemoryAuthChecker.create(
    config.backofficeUsername,
    config.backofficePassword,
  );
};

export const createGenerateJwtFn = (config: AppConfig): GenerateJwtFn =>
  makeGenerateJwt(config.jwtPrivateKey);

export type GenerateVerificationMagicLink = ReturnType<
  typeof createGenerateVerificationMagicLink
>;
// Visible for testing.
export const createGenerateVerificationMagicLink = (config: AppConfig) => {
  const generateJwt = createGenerateJwtFn(config);

  return (id: ImmersionApplicationId, role: Role, targetRoute: string) => {
    const baseUrl = config.immersionFacileBaseUrl;
    const jwt = generateJwt(createMagicLinkPayload(id, role));
    return `${baseUrl}/${targetRoute}?jwt=${jwt}`;
  };
};

const createUseCases = (
  config: AppConfig,
  repositories: Repositories,
  generateJwtFn: GenerateJwtFn,
  generateMagicLinkFn: GenerateVerificationMagicLink,
) => ({
  addDemandeImmersion: new AddImmersionApplication(
    repositories.demandeImmersion,
    createNewEvent,
    repositories.outbox,
  ),
  addDemandeImmersionML: new AddImmersionApplicationML(
    repositories.demandeImmersion,
    createNewEvent,
    repositories.outbox,
    generateJwtFn,
  ),
  getDemandeImmersion: new GetImmersionApplication(
    repositories.demandeImmersion,
  ),
  listDemandeImmersion: new ListImmersionApplication({
    immersionApplicationRepository: repositories.demandeImmersion,
    featureFlags: config.featureFlags,
  }),
  updateDemandeImmersion: new UpdateImmersionApplication(
    createNewEvent,
    repositories.outbox,
    repositories.demandeImmersion,
    config.featureFlags,
  ),
  validateDemandeImmersion: new ValidateImmersionApplication(
    repositories.demandeImmersion,
    createNewEvent,
    repositories.outbox,
  ),
  updateImmersionApplicationStatus: new UpdateImmersionApplicationStatus(
    repositories.demandeImmersion,
    createNewEvent,
    repositories.outbox,
  ),
  generateMagicLink: new GenerateMagicLink(generateJwtFn),

  // immersionOffer
  addImmersionOffer: new AddImmersionOffer(repositories.immersionOffer),

  // searchImmersion
  searchImmersion: new SearchImmersion(repositories.immersionOfferForSearch),

  // siret
  getSiret: new GetSiret({
    sireneRepository: repositories.sirene,
  }),

  // rome
  romeSearch: new RomeSearch(repositories.rome),

  // notifications
  confirmToBeneficiaryThatApplicationCorrectlySubmitted:
    new ConfirmToBeneficiaryThatApplicationCorrectlySubmitted(
      repositories.email,
      config.emailAllowList,
      repositories.agency,
    ),
  confirmToMentorThatApplicationCorrectlySubmitted:
    new ConfirmToMentorThatApplicationCorrectlySubmitted(
      repositories.email,
      config.emailAllowList,
      repositories.agency,
    ),
  notifyAllActorsOfFinalApplicationValidation:
    new NotifyAllActorsOfFinalApplicationValidation(
      repositories.email,
      config.emailAllowList,
      repositories.agency,
    ),
  notifyNewApplicationNeedsReview: new NotifyNewApplicationNeedsReview(
    repositories.email,
    repositories.agency,
    generateMagicLinkFn,
  ),
  notifyToTeamApplicationSubmittedByBeneficiary:
    new NotifyToTeamApplicationSubmittedByBeneficiary(
      repositories.email,
      repositories.agency,
      generateMagicLinkFn,
    ),
  notifyBeneficiaryAndEnterpriseThatApplicationIsRejected:
    new NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
      repositories.email,
      config.emailAllowList,
      repositories.agency,
    ),
  notifyBeneficiaryAndEnterpriseThatApplicationNeedsModifications:
    new NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification(
      repositories.email,
      config.emailAllowList,
      repositories.agency,
      generateMagicLinkFn,
    ),
});

const createEventBus = () => new InMemoryEventBus();

const createEventCrawler = (
  config: AppConfig,
  outbox: OutboxRepository,
  eventBus: EventBus,
): EventCrawler =>
  config.eventCrawlerPeriodMs > 0
    ? new RealEventCrawler(eventBus, outbox, config.eventCrawlerPeriodMs)
    : new BasicEventCrawler(eventBus, outbox);

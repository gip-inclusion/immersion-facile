import { Pool } from "pg";
import { ALWAYS_REJECT } from "../../domain/auth/AuthChecker";
import { InMemoryAuthChecker } from "../../domain/auth/InMemoryAuthChecker";
import { GenerateJwtFn, makeGenerateJwt } from "../../domain/auth/jwt";
import {
  EventBus,
  makeCreateNewEvent,
} from "../../domain/core/eventBus/EventBus";
import { EventCrawler } from "../../domain/core/eventBus/EventCrawler";
import { EmailFilter } from "../../domain/core/ports/EmailFilter";
import { OutboxRepository } from "../../domain/core/ports/OutboxRepository";
import {
  AddImmersionApplication,
  AddImmersionApplicationML,
} from "../../domain/immersionApplication/useCases/AddImmersionApplication";
import { GenerateMagicLink } from "../../domain/immersionApplication/useCases/GenerateMagicLink";
import { GetImmersionApplication } from "../../domain/immersionApplication/useCases/GetImmersionApplication";
import { ListAgencies } from "../../domain/immersionApplication/useCases/ListAgencies";
import { ListImmersionApplication } from "../../domain/immersionApplication/useCases/ListImmersionApplication";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmitted } from "../../domain/immersionApplication/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmitted";
import { ConfirmToMentorThatApplicationCorrectlySubmitted } from "../../domain/immersionApplication/useCases/notifications/ConfirmToMentorThatApplicationCorrectlySubmitted";
import { NotifyAllActorsOfFinalApplicationValidation } from "../../domain/immersionApplication/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";
import { NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification } from "../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import { NotifyNewApplicationNeedsReview } from "../../domain/immersionApplication/useCases/notifications/NotifyNewApplicationNeedsReview";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../domain/immersionApplication/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { UpdateImmersionApplication } from "../../domain/immersionApplication/useCases/UpdateImmersionApplication";
import { UpdateImmersionApplicationStatus } from "../../domain/immersionApplication/useCases/UpdateImmersionApplicationStatus";
import { ValidateImmersionApplication } from "../../domain/immersionApplication/useCases/ValidateImmersionApplication";
import { AddFormEstablishment } from "../../domain/immersionOffer/useCases/AddFormEstablishment";
import { SearchImmersion } from "../../domain/immersionOffer/useCases/SearchImmersion";
import { RomeSearch } from "../../domain/rome/useCases/RomeSearch";
import { GetSiret } from "../../domain/sirene/useCases/GetSiret";
import { ImmersionApplicationId } from "../../shared/ImmersionApplicationDto";
import {
  createMagicLinkPayload,
  Role,
} from "../../shared/tokens/MagicLinkPayload";
import { createLogger } from "../../utils/logger";
import { CachingAccessTokenGateway } from "../secondary/core/CachingAccessTokenGateway";
import { RealClock } from "../secondary/core/ClockImplementations";
import {
  AllowListEmailFilter,
  AlwaysAllowEmailFilter,
} from "../secondary/core/EmailFilterImplementations";
import {
  BasicEventCrawler,
  RealEventCrawler,
} from "../secondary/core/EventCrawlerImplementations";
import { InMemoryEventBus } from "../secondary/core/InMemoryEventBus";
import { InMemoryOutboxRepository } from "../secondary/core/InMemoryOutboxRepository";
import { UuidV4Generator } from "../secondary/core/UuidGeneratorImplementations";
import { HttpsSireneRepository } from "../secondary/HttpsSireneRepository";
import { InMemoryImmersionOfferRepository as InMemoryImmersionOfferRepositoryForSearch } from "../secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { PoleEmploiAccessTokenGateway } from "../secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { PoleEmploiRomeGateway } from "../secondary/immersionOffer/PoleEmploiRomeGateway";
import { InMemoryAgencyRepository } from "../secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../secondary/InMemoryEmailGateway";
import { InMemoryFormEstablishmentRepository } from "../secondary/InMemoryFormEstablishmentRepository";
import { InMemoryImmersionApplicationRepository } from "../secondary/InMemoryImmersionApplicationRepository";
import { InMemoryRomeGateway } from "../secondary/InMemoryRomeGateway";
import { InMemorySireneRepository } from "../secondary/InMemorySireneRepository";
import { PgFormEstablishmentRepository } from "../secondary/pg/FormEstablishmentRepository";
import { PgImmersionApplicationRepository } from "../secondary/pg/PgImmersionApplicationRepository";
import { PgImmersionOfferRepository as PgImmersionOfferRepositoryForSearch } from "../secondary/pg/PgImmersionOfferRepository";
import { SendinblueEmailGateway } from "../secondary/SendinblueEmailGateway";
import { PgAgencyRepository } from "./../secondary/pg/PgAgencyRepository";
import { AppConfig } from "./appConfig";
import { createAuthMiddleware } from "./authMiddleware";
import { TransformFormEstablishmentIntoSearchData } from "../../domain/immersionOffer/useCases/TransformFormEstablishmentIntoSearchData";
import { APIAdresseGateway } from "../secondary/immersionOffer/APIAdresseGateway";

const logger = createLogger(__filename);

const clock = new RealClock();
const uuidGenerator = new UuidV4Generator();

export const createAppDependencies = async (config: AppConfig) => {
  const repositories = await createRepositories(config);
  const eventBus = createEventBus();
  const generateJwtFn = createGenerateJwtFn(config);
  const generateMagicLinkFn = createGenerateVerificationMagicLink(config);
  const emailFilter = config.skipEmailAllowlist
    ? new AlwaysAllowEmailFilter()
    : new AllowListEmailFilter(config.emailAllowList);
  const adressGateway = new APIAdresseGateway();

  return {
    useCases: createUseCases(
      config,
      repositories,
      generateJwtFn,
      generateMagicLinkFn,
      emailFilter,
      adressGateway,
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
type Repositories = ReturnType<typeof createRepositories> extends Promise<infer T>
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
    formEstablishment:
      config.repositories === "PG"
        ? new PgFormEstablishmentRepository(await config.pgPool.connect())
        : new InMemoryFormEstablishmentRepository(),

    immersionOfferForSearch:
      config.repositories === "PG"
        ? new PgImmersionOfferRepositoryForSearch(
            // Details in https://node-postgres.com/features/pooling
            // Now using connection pool
            // TODO: Still we would need to release the connection
            await config.pgPool.connect(),
          )
        : new InMemoryImmersionOfferRepositoryForSearch(),

    agency:
      config.repositories === "PG"
        ? new PgAgencyRepository(await config.pgPool.connect())
        : new InMemoryAgencyRepository(),

    sirene:
      config.sireneRepository === "HTTPS"
        ? HttpsSireneRepository.create(config.sireneHttpsConfig, clock)
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
  emailFilter: EmailFilter,
  addressGateway: APIAdresseGateway,
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
  listDemandeImmersion: new ListImmersionApplication(
    repositories.demandeImmersion,
  ),
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
  searchImmersion: new SearchImmersion(repositories.immersionOfferForSearch),

  addFormEstablishment: new AddFormEstablishment(
    repositories.formEstablishment,
    createNewEvent,
    repositories.outbox,
  ),

  tranformFormEstablishmentToSearchData:
    new TransformFormEstablishmentIntoSearchData(
      repositories.formEstablishment,
      repositories.immersionOfferForSearch,
      addressGateway.getGPSFromAddressAPIAdresse,
      repositories.sirene,
    ),

  // siret
  getSiret: new GetSiret(repositories.sirene),

  // rome
  romeSearch: new RomeSearch(repositories.rome),

  // agencies
  listAgencies: new ListAgencies(repositories.agency),

  // notifications
  confirmToBeneficiaryThatApplicationCorrectlySubmitted:
    new ConfirmToBeneficiaryThatApplicationCorrectlySubmitted(
      emailFilter,
      repositories.email,
    ),
  confirmToMentorThatApplicationCorrectlySubmitted:
    new ConfirmToMentorThatApplicationCorrectlySubmitted(
      emailFilter,
      repositories.email,
    ),
  notifyAllActorsOfFinalApplicationValidation:
    new NotifyAllActorsOfFinalApplicationValidation(
      emailFilter,
      repositories.email,
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
      emailFilter,
      repositories.email,
      repositories.agency,
    ),
  notifyBeneficiaryAndEnterpriseThatApplicationNeedsModifications:
    new NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification(
      emailFilter,
      repositories.email,
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

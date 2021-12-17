import { Pool, PoolClient } from "pg";
import { ALWAYS_REJECT } from "../../domain/auth/AuthChecker";
import { InMemoryAuthChecker } from "../../domain/auth/InMemoryAuthChecker";
import { GenerateMagicLinkJwt, makeGenerateJwt } from "../../domain/auth/jwt";
import {
  EventBus,
  makeCreateNewEvent,
} from "../../domain/core/eventBus/EventBus";
import { EventCrawler } from "../../domain/core/eventBus/EventCrawler";
import { EmailFilter } from "../../domain/core/ports/EmailFilter";
import { OutboxRepository } from "../../domain/core/ports/OutboxRepository";
import { unrestrictedRateLimiter } from "../../domain/core/ports/RateLimiter";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../domain/core/ports/UnitOfWork";
import { AddImmersionApplication } from "../../domain/immersionApplication/useCases/AddImmersionApplication";
import { GenerateMagicLink } from "../../domain/immersionApplication/useCases/GenerateMagicLink";
import { GetImmersionApplication } from "../../domain/immersionApplication/useCases/GetImmersionApplication";
import { ListAgencies } from "../../domain/immersionApplication/useCases/ListAgencies";
import { ListImmersionApplication } from "../../domain/immersionApplication/useCases/ListImmersionApplication";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmitted } from "../../domain/immersionApplication/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmitted";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature } from "../../domain/immersionApplication/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature";
import { ConfirmToMentorThatApplicationCorrectlySubmitted } from "../../domain/immersionApplication/useCases/notifications/ConfirmToMentorThatApplicationCorrectlySubmitted";
import { ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature } from "../../domain/immersionApplication/useCases/notifications/ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature";
import { DeliverRenewedMagicLink } from "../../domain/immersionApplication/useCases/notifications/DeliverRenewedMagicLink";
import { NotifyAllActorsOfFinalApplicationValidation } from "../../domain/immersionApplication/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";
import { NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification } from "../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import { NotifyBeneficiaryOrEnterpriseThatApplicationWasSignedByOtherParty } from "../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryOrEnterpriseThatApplicationWasSignedByOtherParty";
import { NotifyNewApplicationNeedsReview } from "../../domain/immersionApplication/useCases/notifications/NotifyNewApplicationNeedsReview";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../domain/immersionApplication/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { RenewMagicLink } from "../../domain/immersionApplication/useCases/RenewMagicLink";
import { SignImmersionApplication } from "../../domain/immersionApplication/useCases/SignImmersionApplication";
import { UpdateImmersionApplication } from "../../domain/immersionApplication/useCases/UpdateImmersionApplication";
import { UpdateImmersionApplicationStatus } from "../../domain/immersionApplication/useCases/UpdateImmersionApplicationStatus";
import { ValidateImmersionApplication } from "../../domain/immersionApplication/useCases/ValidateImmersionApplication";
import { AddFormEstablishment } from "../../domain/immersionOffer/useCases/AddFormEstablishment";
import { ContactEstablishment } from "../../domain/immersionOffer/useCases/ContactEstablishment";
import { GetImmersionOfferById } from "../../domain/immersionOffer/useCases/GetImmersionOfferById";
import { NotifyConfirmationEstablishmentCreated } from "../../domain/immersionOffer/useCases/notifications/NotifyConfirmationEstablishmentCreated";
import { NotifyEstablishmentOfContactRequest } from "../../domain/immersionOffer/useCases/notifications/NotifyEstablishmentOfContactRequest";
import { SearchImmersion } from "../../domain/immersionOffer/useCases/SearchImmersion";
import { TransformFormEstablishmentIntoSearchData } from "../../domain/immersionOffer/useCases/TransformFormEstablishmentIntoSearchData";
import { RomeGateway } from "../../domain/rome/ports/RomeGateway";
import { RomeSearch } from "../../domain/rome/useCases/RomeSearch";
import { GetSiret } from "../../domain/sirene/useCases/GetSiret";
import { ImmersionApplicationId } from "../../shared/ImmersionApplicationDto";
import { frontRoutes } from "../../shared/routes";
import {
  createMagicLinkPayload,
  Role,
} from "../../shared/tokens/MagicLinkPayload";
import { createLogger } from "../../utils/logger";
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
import { ThrottledSequenceRunner } from "../secondary/core/ThrottledSequenceRunner";
import { UuidV4Generator } from "../secondary/core/UuidGeneratorImplementations";
import { HttpsSireneRepository } from "../secondary/HttpsSireneRepository";
import { HttpAdresseAPI } from "../secondary/immersionOffer/HttpAdresseAPI";
import { InMemoryImmersionOfferRepository } from "../secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemorySearchesMadeRepository } from "../secondary/immersionOffer/InMemorySearchesMadeRepository";
import { InMemoryAgencyRepository } from "../secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../secondary/InMemoryEmailGateway";
import { InMemoryFormEstablishmentRepository } from "../secondary/InMemoryFormEstablishmentRepository";
import { InMemoryImmersionApplicationRepository } from "../secondary/InMemoryImmersionApplicationRepository";
import { InMemoryRomeGateway } from "../secondary/InMemoryRomeGateway";
import { InMemorySireneRepository } from "../secondary/InMemorySireneRepository";
import { InMemoryUowPerformer } from "../secondary/InMemoryUowPerformer";
import { PgAgencyRepository } from "../secondary/pg/PgAgencyRepository";
import { PgFormEstablishmentRepository } from "../secondary/pg/PgFormEstablishmentRepository";
import { PgImmersionApplicationRepository } from "../secondary/pg/PgImmersionApplicationRepository";
import { PgImmersionOfferRepository } from "../secondary/pg/PgImmersionOfferRepository";
import { PgOutboxRepository } from "../secondary/pg/PgOutboxRepository";
import { PgRomeGateway } from "../secondary/pg/PgRomeGateway";
import { PgSearchesMadeRepository } from "../secondary/pg/PgSearchesMadeRepository";
import { PgUowPerformer } from "../secondary/pg/PgUowPerformer";
import { SendinblueEmailGateway } from "../secondary/SendinblueEmailGateway";
import { AppConfig } from "./appConfig";
import {
  createApiKeyAuthMiddleware,
  createJwtAuthMiddleware,
} from "./authMiddleware";

const logger = createLogger(__filename);

const clock = new RealClock();
const uuidGenerator = new UuidV4Generator();
const sequenceRunner = new ThrottledSequenceRunner(1500, 3);

export const createAppDependencies = async (config: AppConfig) => {
  const getPgPoolFn = createGetPgPoolFn(config);
  const repositories = await createRepositories(config, getPgPoolFn);
  const uowPerformer = createUowPerformer(config, getPgPoolFn, repositories);
  const eventBus = createEventBus();
  const generateJwtFn = makeGenerateJwt(config);
  const generateMagicLinkFn = createGenerateVerificationMagicLink(config);
  const emailFilter = config.skipEmailAllowlist
    ? new AlwaysAllowEmailFilter()
    : new AllowListEmailFilter(config.emailAllowList);

  return {
    useCases: createUseCases(
      config,
      repositories,
      generateJwtFn,
      generateMagicLinkFn,
      emailFilter,
      uowPerformer,
    ),
    repositories,
    authChecker: createAuthChecker(config),
    jwtAuthMiddleware: createJwtAuthMiddleware(config),
    apiKeyAuthMiddleware: createApiKeyAuthMiddleware(config),
    generateJwtFn,
    eventBus,
    eventCrawler: createEventCrawler(config, repositories.outbox, eventBus),
    featureFlags: config.featureFlags,
  };
};

export type AppDependencies = ReturnType<
  typeof createAppDependencies
> extends Promise<infer T>
  ? T
  : never;

export type GetPgPoolFn = () => Pool;
export const createGetPgPoolFn = (config: AppConfig): GetPgPoolFn => {
  let pgPool: Pool;
  return () => {
    if (config.repositories !== "PG" && config.romeGateway !== "PG")
      throw new Error(
        `Unexpected pg pool creation: REPOSITORIES=${config.repositories},
         ROME_GATEWAY=${config.romeGateway}`,
      );
    if (!pgPool) {
      const { host, pathname } = new URL(config.pgImmersionDbUrl);
      logger.info({ host, pathname }, "creating postgresql connection pool");
      pgPool = new Pool({ connectionString: config.pgImmersionDbUrl });
    }
    return pgPool;
  };
};

// prettier-ignore
export type Repositories = ReturnType<typeof createRepositories> extends Promise<infer T>
  ? T
  : never;
export const createRepositories = async (
  config: AppConfig,
  getPgPoolFn: GetPgPoolFn,
) => {
  logger.info({
    repositories: config.repositories,
    sireneRepository: config.sireneRepository,
    emailGateway: config.emailGateway,
    romeGateway: config.romeGateway,
  });

  return {
    demandeImmersion:
      config.repositories === "PG"
        ? new PgImmersionApplicationRepository(await getPgPoolFn().connect())
        : new InMemoryImmersionApplicationRepository(),
    formEstablishment:
      config.repositories === "PG"
        ? new PgFormEstablishmentRepository(await getPgPoolFn().connect())
        : new InMemoryFormEstablishmentRepository(),

    searchesMade:
      config.repositories === "PG"
        ? new PgSearchesMadeRepository(await getPgPoolFn().connect())
        : new InMemorySearchesMadeRepository(),

    immersionOffer:
      config.repositories === "PG"
        ? new PgImmersionOfferRepository(
            // Details in https://node-postgres.com/features/pooling
            // Now using connection pool
            // TODO: Still we would need to release the connection
            await getPgPoolFn().connect(),
          )
        : new InMemoryImmersionOfferRepository(),

    agency:
      config.repositories === "PG"
        ? new PgAgencyRepository(await getPgPoolFn().connect())
        : new InMemoryAgencyRepository(),

    sirene:
      config.sireneRepository === "HTTPS"
        ? new HttpsSireneRepository(
            config.sireneHttpsConfig,
            clock,
            unrestrictedRateLimiter,
          )
        : new InMemorySireneRepository(),

    email:
      config.emailGateway === "SENDINBLUE"
        ? SendinblueEmailGateway.create(config.sendinblueApiKey)
        : new InMemoryEmailGateway(),

    rome: await createRomeGateway(config, getPgPoolFn),

    outbox:
      config.repositories === "PG"
        ? new PgOutboxRepository(await getPgPoolFn().connect())
        : new InMemoryOutboxRepository(),
  };
};

const createRomeGateway = async (
  config: AppConfig,
  getPgPoolFn: GetPgPoolFn,
): Promise<RomeGateway> => {
  switch (config.romeGateway) {
    case "PG":
      return new PgRomeGateway(await getPgPoolFn().connect());
    default:
      return new InMemoryRomeGateway();
  }
};

export type InMemoryUnitOfWork = ReturnType<typeof createInMemoryUow>;
export const createInMemoryUow = (repositories?: Repositories) => ({
  outboxRepo:
    (repositories?.outbox as InMemoryOutboxRepository) ??
    new InMemoryOutboxRepository(),
  formEstablishmentRepo:
    (repositories?.formEstablishment as InMemoryFormEstablishmentRepository) ??
    new InMemoryFormEstablishmentRepository(),
  immersionOfferRepo:
    (repositories?.immersionOffer as InMemoryImmersionOfferRepository) ??
    new InMemoryImmersionOfferRepository(),
});

// following function is for type check only, it is verifies InMemoryUnitOfWork is assignable to UnitOfWork
const isAssignable = (): UnitOfWork => {
  const inMemory = null as unknown as InMemoryUnitOfWork;
  return inMemory;
};

export const createPgUow = (client: PoolClient): UnitOfWork => ({
  outboxRepo: new PgOutboxRepository(client),
  formEstablishmentRepo: new PgFormEstablishmentRepository(client),
  immersionOfferRepo: new PgImmersionOfferRepository(client),
});

const createUowPerformer = (
  config: AppConfig,
  getPgPoolFn: GetPgPoolFn,
  repositories: Repositories,
): UnitOfWorkPerformer =>
  config.repositories === "PG"
    ? new PgUowPerformer(getPgPoolFn(), createPgUow)
    : new InMemoryUowPerformer(createInMemoryUow(repositories));

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

export type GenerateVerificationMagicLink = ReturnType<
  typeof createGenerateVerificationMagicLink
>;
// Visible for testing.
export const createGenerateVerificationMagicLink = (config: AppConfig) => {
  const generateJwt = makeGenerateJwt(config);

  return (id: ImmersionApplicationId, role: Role, targetRoute: string) => {
    const baseUrl = config.immersionFacileBaseUrl;
    const jwt = generateJwt(createMagicLinkPayload(id, role));
    return `${baseUrl}/${targetRoute}?jwt=${jwt}`;
  };
};

export const createRenewMagicLinkUrl = (
  role: Role,
  applicationId: ImmersionApplicationId,
) => {
  return `/${frontRoutes.magicLinkRenewal}?id=${applicationId}&role=${role}`;
};

export type UseCases = ReturnType<typeof createUseCases>;

const createUseCases = (
  config: AppConfig,
  repositories: Repositories,
  generateJwtFn: GenerateMagicLinkJwt,
  generateMagicLinkFn: GenerateVerificationMagicLink,
  emailFilter: EmailFilter,
  uowPerformer: UnitOfWorkPerformer,
) => {
  const createNewEvent = makeCreateNewEvent({
    clock,
    uuidGenerator,
    quarantinedTopics: config.quarantinedTopics,
  });
  const getSiret = new GetSiret(repositories.sirene);
  const adresseAPI = new HttpAdresseAPI(unrestrictedRateLimiter);

  return {
    addDemandeImmersion: new AddImmersionApplication(
      repositories.demandeImmersion,
      createNewEvent,
      repositories.outbox,
      getSiret,
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
      config.featureFlags,
    ),
    signImmersionApplication: new SignImmersionApplication(
      repositories.demandeImmersion,
      createNewEvent,
      repositories.outbox,
    ),
    generateMagicLink: new GenerateMagicLink(generateJwtFn),
    renewMagicLink: new RenewMagicLink(
      repositories.demandeImmersion,
      createNewEvent,
      repositories.outbox,
      repositories.agency,
      generateJwtFn,
    ),

    // immersionOffer
    searchImmersion: new SearchImmersion(
      repositories.searchesMade,
      repositories.immersionOffer,
    ),
    getImmersionOfferById: new GetImmersionOfferById(
      repositories.immersionOffer,
    ),

    addFormEstablishment: new AddFormEstablishment(
      uowPerformer,
      createNewEvent,
      getSiret,
    ),

    transformFormEstablishmentToSearchData:
      new TransformFormEstablishmentIntoSearchData(
        repositories.immersionOffer,
        adresseAPI,
        repositories.sirene,
        repositories.rome,
        sequenceRunner,
        uuidGenerator,
      ),

    contactEstablishment: new ContactEstablishment(
      uowPerformer,
      createNewEvent,
    ),

    // siret
    getSiret,

    // rome
    romeSearch: new RomeSearch(repositories.rome),

    // agencies
    listAgencies: new ListAgencies(repositories.agency),

    // notifications
    confirmToBeneficiaryThatApplicationCorrectlySubmitted:
      new ConfirmToBeneficiaryThatApplicationCorrectlySubmitted(
        emailFilter,
        repositories.email,
        config.featureFlags,
      ),
    confirmToMentorThatApplicationCorrectlySubmitted:
      new ConfirmToMentorThatApplicationCorrectlySubmitted(
        emailFilter,
        repositories.email,
        config.featureFlags,
      ),

    // notifications
    confirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature:
      new ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature(
        emailFilter,
        repositories.email,
        generateMagicLinkFn,
        config.featureFlags,
      ),
    confirmToMentorThatApplicationCorrectlySubmittedRequestSignature:
      new ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature(
        emailFilter,
        repositories.email,
        generateMagicLinkFn,
        config.featureFlags,
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
    deliverRenewedMagicLink: new DeliverRenewedMagicLink(
      emailFilter,
      repositories.email,
    ),
    notifyConfirmationEstablishmentCreated:
      new NotifyConfirmationEstablishmentCreated(
        emailFilter,
        repositories.email,
      ),
    notifyEstablishmentOfContactRequest:
      new NotifyEstablishmentOfContactRequest(emailFilter, repositories.email),
    notifyBeneficiaryOrEnterpriseThatApplicationWasSignedByOtherParty:
      new NotifyBeneficiaryOrEnterpriseThatApplicationWasSignedByOtherParty(
        emailFilter,
        repositories.email,
        repositories.agency,
        generateMagicLinkFn,
      ),
  };
};

const createEventBus = () => new InMemoryEventBus();

const createEventCrawler = (
  config: AppConfig,
  outbox: OutboxRepository,
  eventBus: EventBus,
): EventCrawler =>
  config.eventCrawlerPeriodMs > 0
    ? new RealEventCrawler(eventBus, outbox, config.eventCrawlerPeriodMs)
    : new BasicEventCrawler(eventBus, outbox);

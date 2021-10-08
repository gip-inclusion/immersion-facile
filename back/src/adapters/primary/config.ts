import { ALWAYS_REJECT } from "../../domain/auth/AuthChecker";
import { InMemoryAuthChecker } from "../../domain/auth/InMemoryAuthChecker";
import {
  EventBus,
  makeCreateNewEvent,
} from "../../domain/core/eventBus/EventBus";
import { EventCrawler } from "../../domain/core/eventBus/EventCrawler";
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
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../domain/immersionApplication/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { UpdateImmersionApplication } from "../../domain/immersionApplication/useCases/UpdateImmersionApplication";
import { ValidateImmersionApplication } from "../../domain/immersionApplication/useCases/ValidateImmersionApplication";
import { AddImmersionOffer } from "../../domain/immersionOffer/useCases/AddImmersionOffer";
import { RomeSearch } from "../../domain/rome/useCases/RomeSearch";
import { GetSiret } from "../../domain/sirene/useCases/GetSiret";
import { AgencyCode, agencyCodeFromString } from "../../shared/agencies";
import { FeatureFlags } from "../../shared/featureFlags";
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
import { InMemoryEmailGateway } from "../secondary/InMemoryEmailGateway";
import { InMemoryEventBus } from "../secondary/InMemoryEventBus";
import { InMemoryImmersionApplicationRepository } from "../secondary/InMemoryImmersionApplicationRepository";
import { InMemoryImmersionOfferRepository } from "../secondary/InMemoryImmersionOfferRepository";
import { InMemoryRomeGateway } from "../secondary/InMemoryRomeGateway";
import { InMemorySireneRepository } from "../secondary/InMemorySireneRepository";
import { SendinblueEmailGateway } from "../secondary/SendinblueEmailGateway";
import { createLogger } from "./../../utils/logger";
import { PoleEmploiAccessTokenGateway } from "./../secondary/PoleEmploiAccessTokenGateway";
import { PoleEmploiRomeGateway } from "./../secondary/PoleEmploiRomeGateway";

const logger = createLogger(__filename);
const useAirtable = (): boolean => {
  return process.env.REPOSITORIES === "AIRTABLE";
};

const clock = new RealClock();
const uuidGenerator = new UuidV4Generator();

export const createConfig = (featureFlags: FeatureFlags) => {
  const repositories = createRepositories(featureFlags);
  const eventBus = createEventBus();
  return {
    useCases: createUsecases(featureFlags, repositories),
    authChecker: createAuthChecker(),
    eventBus: eventBus,
    eventCrawler: createEventCrawler(repositories, eventBus),
  };
};

export type AppConfig = ReturnType<typeof createConfig>;

const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

const getApplicationRepository = (
  featureFlags: FeatureFlags,
): ImmersionApplicationRepository => {
  const repositoriesBySource: ApplicationRepositoryMap = {};
  if (
    featureFlags.enableGenericApplicationForm ||
    featureFlags.enableMagicLinks
  ) {
    repositoriesBySource["GENERIC"] = useAirtable()
      ? AirtableDemandeImmersionRepository.create(
          getEnvVarOrDie("AIRTABLE_API_KEY"),
          getEnvVarOrDie("AIRTABLE_BASE_ID_GENERIC"),
          getEnvVarOrDie("AIRTABLE_TABLE_NAME_GENERIC"),
          genericApplicationDataConverter,
        )
      : new InMemoryImmersionApplicationRepository();
  }
  if (featureFlags.enableBoulogneSurMerApplicationForm) {
    repositoriesBySource["BOULOGNE_SUR_MER"] = useAirtable()
      ? AirtableDemandeImmersionRepository.create(
          getEnvVarOrDie("AIRTABLE_API_KEY"),
          getEnvVarOrDie("AIRTABLE_BASE_ID_BOULOGNE_SUR_MER"),
          getEnvVarOrDie("AIRTABLE_TABLE_NAME_BOULOGNE_SUR_MER"),
          legacyApplicationDataConverter,
        )
      : new InMemoryImmersionApplicationRepository();
  }
  if (featureFlags.enableNarbonneApplicationForm) {
    repositoriesBySource["NARBONNE"] = useAirtable()
      ? AirtableDemandeImmersionRepository.create(
          getEnvVarOrDie("AIRTABLE_API_KEY"),
          getEnvVarOrDie("AIRTABLE_BASE_ID_NARBONNE"),
          getEnvVarOrDie("AIRTABLE_TABLE_NAME_NARBONNE"),
          legacyApplicationDataConverter,
        )
      : new InMemoryImmersionApplicationRepository();
  }
  return new ApplicationRepositorySwitcher(repositoriesBySource);
};

const createRepositories = (featureFlags: FeatureFlags) => {
  logger.info("REPOSITORIES : " + process.env.REPOSITORIES ?? "IN_MEMORY");
  logger.info(
    "SIRENE_REPOSITORY: " + process.env.SIRENE_REPOSITORY ?? "IN_MEMORY",
  );
  logger.info("EMAIL_GATEWAY: " + process.env.EMAIL_GATEWAY ?? "IN_MEMORY");
  logger.info("ROME_GATEWAY: " + process.env.ROME_GATEWAY ?? "IN_MEMORY");

  return {
    demandeImmersion: getApplicationRepository(featureFlags),
    immersionOffer: useAirtable()
      ? AirtableImmersionOfferRepository.create(
          getEnvVarOrDie("AIRTABLE_API_KEY"),
          getEnvVarOrDie("AIRTABLE_BASE_ID_IMMERSION_OFFER"),
          getEnvVarOrDie("AIRTABLE_TABLE_NAME_IMMERSION_OFFER"),
          immersionOfferDataConverter,
        )
      : new InMemoryImmersionOfferRepository(),

    sirene:
      process.env.SIRENE_REPOSITORY === "HTTPS"
        ? HttpsSireneRepository.create(
            getEnvVarOrDie("SIRENE_ENDPOINT"),
            getEnvVarOrDie("SIRENE_BEARER_TOKEN"),
          )
        : new InMemorySireneRepository(),

    email:
      process.env.EMAIL_GATEWAY === "SENDINBLUE"
        ? SendinblueEmailGateway.create(getEnvVarOrDie("SENDINBLUE_API_KEY"))
        : new InMemoryEmailGateway(),

    rome:
      process.env.ROME_GATEWAY === "POLE_EMPLOI"
        ? new PoleEmploiRomeGateway(
            new CachingAccessTokenGateway(
              new PoleEmploiAccessTokenGateway(
                getEnvVarOrDie("POLE_EMPLOI_CLIENT_ID"),
                getEnvVarOrDie("POLE_EMPLOI_CLIENT_SECRET"),
              ),
            ),
            getEnvVarOrDie("POLE_EMPLOI_CLIENT_ID"),
          )
        : new InMemoryRomeGateway(),

    outbox: new InMemoryOutboxRepository(),
  };
};

export const createAuthChecker = () => {
  let username: string;
  let password: string;

  if (process.env.NODE_ENV === "test") {
    // Prevent failure when the username/password env variables are not set in tests
    username = "e2e_tests";
    password = "e2e";
  } else if (
    !process.env.BACKOFFICE_USERNAME ||
    !process.env.BACKOFFICE_PASSWORD
  ) {
    logger.warn("Missing backoffice credentials. Disabling backoffice access.");
    return ALWAYS_REJECT;
  } else {
    username = getEnvVarOrDie("BACKOFFICE_USERNAME");
    password = getEnvVarOrDie("BACKOFFICE_PASSWORD");
  }

  return InMemoryAuthChecker.create(username, password);
};

const getEnvVarOrDie = (envVar: string) =>
  process.env[envVar] || fail(`Missing environment variable: ${envVar}`);

const fail = (message: string) => {
  throw new Error(message);
};

const createUsecases = (featureFlags: FeatureFlags, repositories: any) => {
  const supervisorEmail = process.env.SUPERVISOR_EMAIL;
  if (!supervisorEmail) {
    logger.warn(
      "No SUPERVISOR_EMAIL specified. Disabling the sending of supervisor emails.",
    );
  }

  const unrestrictedEmailSendingAgencies: Readonly<Set<AgencyCode>> = new Set(
    (process.env.UNRESTRICTED_EMAIL_SENDING_AGENCIES || "")
      .split(",")
      .filter((el) => !!el)
      .map(agencyCodeFromString)
      .filter((agencyCode) => agencyCode !== "_UNKNOWN"),
  );
  logger.debug(
    {
      unrestrictedEmailSendingAgencies: Array.from(
        unrestrictedEmailSendingAgencies,
      ),
    },
    "UNRESTRICTED_EMAIL_SENDING_AGENCIES",
  );

  const emailAllowList: Readonly<Set<string>> = new Set(
    (process.env.EMAIL_ALLOW_LIST || "").split(",").filter((el) => !!el),
  );
  logger.debug(
    { emailAllowList: Array.from(emailAllowList) },
    "EMAIL_ALLOW_LIST",
  );
  if (emailAllowList.size == 0) {
    logger.warn(
      "Empty EMAIL_ALLOW_LIST. Disabling the sending of non-supervisor emails for agencies with ",
      "restricted email sending.",
    );
  }

  // Format: COUNSELLOR_EMAILS=<agencyCode>:<email>,<agencyCode>:<email>,...
  const counsellorEmails: Record<AgencyCode, string[]> = (
    process.env.COUNSELLOR_EMAILS || ""
  )
    .split(",")
    .filter((el) => !!el)
    .reduce((acc, el) => {
      const [str, email] = el.split(":", 2);
      const agencyCode = agencyCodeFromString(str);
      return {
        ...acc,
        [agencyCode]: [...(acc[agencyCode] || []), email],
      };
    }, {} as Record<AgencyCode, string[]>);
  logger.debug({ counsellorEmails: counsellorEmails }, "COUNSELLOR_EMAILS");

  return {
    addDemandeImmersion: new AddImmersionApplication(
      repositories.demandeImmersion,
      createNewEvent,
      repositories.outbox,
    ),
    addDemandeImmersionML: new AddImmersionApplicationML(
      repositories.demandeImmersion,
      createNewEvent,
      repositories.outbox,
    ),
    getDemandeImmersion: new GetImmersionApplication(
      repositories.demandeImmersion,
    ),
    listDemandeImmersion: new ListImmersionApplication({
      immersionApplicationRepository: repositories.demandeImmersion,
      featureFlags,
    }),
    updateDemandeImmersion: new UpdateImmersionApplication({
      immersionApplicationRepository: repositories.demandeImmersion,
      featureFlags,
    }),
    validateDemandeImmersion: new ValidateImmersionApplication(
      repositories.demandeImmersion,
      createNewEvent,
      repositories.outbox,
    ),

    // immersionOffer
    addImmersionOffer: new AddImmersionOffer(repositories.immersionOffer),

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
        emailAllowList,
        unrestrictedEmailSendingAgencies,
      ),
    confirmToMentorThatApplicationCorrectlySubmitted:
      new ConfirmToMentorThatApplicationCorrectlySubmitted(
        repositories.email,
        emailAllowList,
        unrestrictedEmailSendingAgencies,
      ),
    notifyAllActorsOfFinalApplicationValidation:
      new NotifyAllActorsOfFinalApplicationValidation(
        repositories.email,
        emailAllowList,
        unrestrictedEmailSendingAgencies,
        counsellorEmails,
      ),
    notifyToTeamApplicationSubmittedByBeneficiary:
      new NotifyToTeamApplicationSubmittedByBeneficiary(
        repositories.email,
        supervisorEmail,
      ),
  };
};

const createEventBus = () => new InMemoryEventBus();

const createEventCrawler = (
  repositories: any,
  eventBus: EventBus,
): EventCrawler => {
  const eventCrawlerPeriodMs: number = process.env.EVENT_CRAWLER_PERIOD_MS
    ? parseInt(process.env.EVENT_CRAWLER_PERIOD_MS)
    : 0;
  return eventCrawlerPeriodMs > 0
    ? new RealEventCrawler(eventBus, repositories.outbox, eventCrawlerPeriodMs)
    : new BasicEventCrawler(eventBus, repositories.outbox);
};

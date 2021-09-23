import { ALWAYS_REJECT } from "../../domain/auth/AuthChecker";
import { InMemoryAuthChecker } from "../../domain/auth/InMemoryAuthChecker";
import {
  EventBus,
  makeCreateNewEvent
} from "../../domain/core/eventBus/EventBus";
import { EventCrawler } from "../../domain/core/eventBus/EventCrawler";
import { DemandeImmersionRepository } from "../../domain/demandeImmersion/ports/DemandeImmersionRepository";
import { AddDemandeImmersion } from "../../domain/demandeImmersion/useCases/AddDemandeImmersion";
import { GetDemandeImmersion } from "../../domain/demandeImmersion/useCases/GetDemandeImmersion";
import { ListDemandeImmersion } from "../../domain/demandeImmersion/useCases/ListDemandeImmersion";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmitted } from "../../domain/demandeImmersion/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmitted";
import { ConfirmToMentorThatApplicationCorrectlySubmitted } from "../../domain/demandeImmersion/useCases/notifications/ConfirmToMentorThatApplicationCorrectlySubmitted";
import { NotifyAllActorsOfFinalApplicationValidation } from "../../domain/demandeImmersion/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../domain/demandeImmersion/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { UpdateDemandeImmersion } from "../../domain/demandeImmersion/useCases/UpdateDemandeImmersion";
import { ValidateDemandeImmersion } from "../../domain/demandeImmersion/useCases/ValidateDemandeImmersion";
import { AddImmersionOffer } from "../../domain/immersionOffer/useCases/AddImmersionOffer";
import { RomeSearch } from "../../domain/rome/useCases/RomeSearch";
import { GetSiret } from "../../domain/sirene/useCases/GetSiret";
import {
  ApplicationSource,
  applicationSourceFromString
} from "../../shared/DemandeImmersionDto";
import { FeatureFlags } from "../../shared/featureFlags";
import { logger } from "../../utils/logger";
import {
  genericApplicationDataConverter,
  legacyApplicationDataConverter
} from "../secondary/AirtableApplicationDataConverters";
import { AirtableDemandeImmersionRepository } from "../secondary/AirtableDemandeImmersionRepository";
import {
  ApplicationRepositoryMap,
  ApplicationRepositorySwitcher
} from "../secondary/ApplicationRepositorySwitcher";
import { RealClock } from "../secondary/core/ClockImplementations";
import {
  BasicEventCrawler,
  RealEventCrawler
} from "../secondary/core/EventCrawlerImplementations";
import { InMemoryOutboxRepository } from "../secondary/core/InMemoryOutboxRepository";
import { UuidV4Generator } from "../secondary/core/UuidGeneratorImplementations";
import { HttpsSireneRepository } from "../secondary/HttpsSireneRepository";
import { InMemoryDemandeImmersionRepository } from "../secondary/InMemoryDemandeImmersionRepository";
import { InMemoryEmailGateway } from "../secondary/InMemoryEmailGateway";
import { InMemoryEventBus } from "../secondary/InMemoryEventBus";
import { InMemorySireneRepository } from "../secondary/InMemorySireneRepository";
import { SendinblueEmailGateway } from "../secondary/SendinblueEmailGateway";

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

const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

const getApplicationRepository = (
  featureFlags: FeatureFlags,
): DemandeImmersionRepository => {
  const useAirtable = process.env.REPOSITORIES === "AIRTABLE";
  const repositoriesBySource: ApplicationRepositoryMap = {};
  if (featureFlags.enableGenericApplicationForm) {
    repositoriesBySource["GENERIC"] = useAirtable
      ? AirtableDemandeImmersionRepository.create(
          getEnvVarOrDie("AIRTABLE_API_KEY"),
          getEnvVarOrDie("AIRTABLE_BASE_ID_GENERIC"),
          getEnvVarOrDie("AIRTABLE_TABLE_NAME_GENERIC"),
          genericApplicationDataConverter,
        )
      : new InMemoryDemandeImmersionRepository();
  }
  if (featureFlags.enableBoulogneSurMerApplicationForm) {
    repositoriesBySource["BOULOGNE_SUR_MER"] = useAirtable
      ? AirtableDemandeImmersionRepository.create(
          getEnvVarOrDie("AIRTABLE_API_KEY"),
          getEnvVarOrDie("AIRTABLE_BASE_ID_BOULOGNE_SUR_MER"),
          getEnvVarOrDie("AIRTABLE_TABLE_NAME_BOULOGNE_SUR_MER"),
          legacyApplicationDataConverter,
        )
      : new InMemoryDemandeImmersionRepository();
  }
  if (featureFlags.enableNarbonneApplicationForm) {
    repositoriesBySource["NARBONNE"] = useAirtable
      ? AirtableDemandeImmersionRepository.create(
          getEnvVarOrDie("AIRTABLE_API_KEY"),
          getEnvVarOrDie("AIRTABLE_BASE_ID_NARBONNE"),
          getEnvVarOrDie("AIRTABLE_TABLE_NAME_NARBONNE"),
          legacyApplicationDataConverter,
        )
      : new InMemoryDemandeImmersionRepository();
  }
  return new ApplicationRepositorySwitcher(repositoriesBySource);
};

const createRepositories = (featureFlags: FeatureFlags) => {
  logger.info("Repositories : " + process.env.REPOSITORIES ?? "IN_MEMORY");
  logger.info(
    "SIRENE_REPOSITORY: " + process.env.SIRENE_REPOSITORY ?? "IN_MEMORY",
  );
  logger.info("EMAIL_GATEWAY: " + process.env.EMAIL_GATEWAY ?? "IN_MEMORY");

  return {
    demandeImmersion: getApplicationRepository(featureFlags),
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

  const unrestrictedEmailSendingSources: Readonly<Set<ApplicationSource>> =
    new Set(
      (process.env.UNRESTRICTED_EMAIL_SENDING_SOURCES || "")
        .split(",")
        .filter((el) => !!el)
        .map(applicationSourceFromString)
        .filter((source) => source !== "UNKNOWN"),
    );
  logger.debug(
    {
      unrestrictedEmailSendingSources: Array.from(
        unrestrictedEmailSendingSources,
      ),
    },
    "UNRESTRICTED_EMAIL_SENDING_SOURCES",
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
      "Empty EMAIL_ALLOW_LIST. Disabling the sending of non-supervisor emails for sources with ",
      "restricted email sending.",
    );
  }

  // Format: COUNSELLOR_EMAILS=<source>:<email>,<source>:<email>,...
  const counsellorEmails: Record<ApplicationSource, string[]> = (
    process.env.COUNSELLOR_EMAILS || ""
  )
    .split(",")
    .filter((el) => !!el)
    .reduce((acc, el) => {
      const [sourceStr, email] = el.split(":", 2);
      const source = applicationSourceFromString(sourceStr);
      return {
        ...acc,
        [source]: [...(acc[source] || []), email],
      };
    }, {} as Record<ApplicationSource, string[]>);
  logger.debug({ counsellorEmails: counsellorEmails }, "COUNSELLOR_EMAILS");

  return {
    addDemandeImmersion: new AddDemandeImmersion(
      repositories.demandeImmersion,
      createNewEvent,
      repositories.outbox,
    ),
    getDemandeImmersion: new GetDemandeImmersion(repositories.demandeImmersion),
    listDemandeImmersion: new ListDemandeImmersion({
      demandeImmersionRepository: repositories.demandeImmersion,
      featureFlags,
    }),
    updateDemandeImmersion: new UpdateDemandeImmersion({
      demandeImmersionRepository: repositories.demandeImmersion,
      featureFlags,
    }),
    validateDemandeImmersion: new ValidateDemandeImmersion(
      repositories.demandeImmersion,
      createNewEvent,
      repositories.outbox,
    ),

    // immersionOffer
    addImmersionOffer: new AddImmersionOffer(),

    // siret
    getSiret: new GetSiret({
      sireneRepository: repositories.sirene,
    }),

    // rome
    romeSearch: new RomeSearch(),

    // notifications
    confirmToBeneficiaryThatApplicationCorrectlySubmitted:
      new ConfirmToBeneficiaryThatApplicationCorrectlySubmitted(
        repositories.email,
        emailAllowList,
        unrestrictedEmailSendingSources,
      ),
    confirmToMentorThatApplicationCorrectlySubmitted:
      new ConfirmToMentorThatApplicationCorrectlySubmitted(
        repositories.email,
        emailAllowList,
        unrestrictedEmailSendingSources,
      ),
    notifyAllActorsOfFinalApplicationValidation:
      new NotifyAllActorsOfFinalApplicationValidation(
        repositories.email,
        emailAllowList,
        unrestrictedEmailSendingSources,
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

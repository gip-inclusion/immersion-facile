import { ALWAYS_REJECT } from "../../domain/auth/AuthChecker";
import { InMemoryAuthChecker } from "../../domain/auth/InMemoryAuthChecker";
import { AddDemandeImmersion } from "../../domain/demandeImmersion/useCases/AddDemandeImmersion";
import { GetDemandeImmersion } from "../../domain/demandeImmersion/useCases/GetDemandeImmersion";
import { ListDemandeImmersion } from "../../domain/demandeImmersion/useCases/ListDemandeImmersion";
import { UpdateDemandeImmersion } from "../../domain/demandeImmersion/useCases/UpdateDemandeImmersion";
import { ValidateDemandeImmersion } from "../../domain/demandeImmersion/useCases/ValidateDemandeImmersion";
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
import {
  ApplicationRepositoryMap,
  ApplicationRepositorySwitcher
} from "../secondary/ApplicationRepositorySwitcher";
import { HttpsSireneRepository } from "../secondary/HttpsSireneRepository";
import { InMemoryDemandeImmersionRepository } from "../secondary/InMemoryDemandeImmersionRepository";
import { InMemoryEmailGateway } from "../secondary/InMemoryEmailGateway";
import { InMemorySireneRepository } from "../secondary/InMemorySireneRepository";
import { SendinblueEmailGateway } from "../secondary/SendinblueEmailGateway";
import { DemandeImmersionRepository } from "./../../domain/demandeImmersion/ports/DemandeImmersionRepository";
import { AirtableDemandeImmersionRepository } from "./../secondary/AirtableDemandeImmersionRepository";

const getApplicationRepository = (
  featureFlags: FeatureFlags
): DemandeImmersionRepository => {
  const useAirtable = process.env.REPOSITORIES === "AIRTABLE";
  const repositoriesBySource: ApplicationRepositoryMap = {};
  if (featureFlags.enableGenericApplicationForm) {
    repositoriesBySource["GENERIC"] = useAirtable
      ? AirtableDemandeImmersionRepository.create(
          getEnvVarOrDie("AIRTABLE_API_KEY"),
          getEnvVarOrDie("AIRTABLE_BASE_ID_GENERIC"),
          getEnvVarOrDie("AIRTABLE_TABLE_NAME_GENERIC"),
          genericApplicationDataConverter
        )
      : new InMemoryDemandeImmersionRepository();
  }
  if (featureFlags.enableBoulogneSurMerApplicationForm) {
    repositoriesBySource["BOULOGNE_SUR_MER"] = useAirtable
      ? AirtableDemandeImmersionRepository.create(
          getEnvVarOrDie("AIRTABLE_API_KEY"),
          getEnvVarOrDie("AIRTABLE_BASE_ID_BOULOGNE_SUR_MER"),
          getEnvVarOrDie("AIRTABLE_TABLE_NAME_BOULOGNE_SUR_MER"),
          legacyApplicationDataConverter
        )
      : new InMemoryDemandeImmersionRepository();
  }
  if (featureFlags.enableNarbonneApplicationForm) {
    repositoriesBySource["NARBONNE"] = useAirtable
      ? AirtableDemandeImmersionRepository.create(
          getEnvVarOrDie("AIRTABLE_API_KEY"),
          getEnvVarOrDie("AIRTABLE_BASE_ID_NARBONNE"),
          getEnvVarOrDie("AIRTABLE_TABLE_NAME_NARBONNE"),
          legacyApplicationDataConverter
        )
      : new InMemoryDemandeImmersionRepository();
  }
  return new ApplicationRepositorySwitcher(repositoriesBySource);
};

export const getRepositories = (featureFlags: FeatureFlags) => {
  logger.info("Repositories : " + process.env.REPOSITORIES ?? "IN_MEMORY");
  logger.info(
    "SIRENE_REPOSITORY: " + process.env.SIRENE_REPOSITORY ?? "IN_MEMORY"
  );
  logger.info("EMAIL_GATEWAY: " + process.env.EMAIL_GATEWAY ?? "IN_MEMORY");

  return {
    demandeImmersion: getApplicationRepository(featureFlags),
    sirene:
      process.env.SIRENE_REPOSITORY === "HTTPS"
        ? HttpsSireneRepository.create(
            getEnvVarOrDie("SIRENE_ENDPOINT"),
            getEnvVarOrDie("SIRENE_BEARER_TOKEN")
          )
        : new InMemorySireneRepository(),

    email:
      process.env.EMAIL_GATEWAY === "SENDINBLUE"
        ? SendinblueEmailGateway.create(getEnvVarOrDie("SENDINBLUE_API_KEY"))
        : new InMemoryEmailGateway(),
  };
};

export const getAuthChecker = () => {
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

export const getUsecases = (featureFlags: FeatureFlags) => {
  const repositories = getRepositories(featureFlags);
  const supervisorEmail = process.env.SUPERVISOR_EMAIL;
  if (!supervisorEmail) {
    logger.warn(
      "No SUPERVISOR_EMAIL specified. Disabling the sending of supervisor emails."
    );
  }

  const unrestrictedEmailSendingSources: Readonly<Set<ApplicationSource>> =
    new Set(
      (process.env.UNRESTRICTED_EMAIL_SENDING_SOURCES || "")
        .split(",")
        .filter((el) => !!el)
        .map(applicationSourceFromString)
        .filter((source) => source !== "UNKNOWN")
    );

  const emailAllowList: Readonly<Set<string>> = new Set(
    (process.env.EMAIL_ALLOW_LIST || "").split(",").filter((el) => !!el)
  );
  if (!emailAllowList) {
    logger.warn(
      "Empty EMAIL_ALLOW_LIST. Disabling the sending of non-supervisor emails for sources with ",
      "restricted email sending."
    );
  }

  return {
    // formulaire
    addDemandeImmersion: new AddDemandeImmersion({
      applicationRepository: repositories.demandeImmersion,
      emailGateway: repositories.email,
      supervisorEmail: supervisorEmail,
      unrestrictedEmailSendingSources,
      emailAllowList,
    }),
    getDemandeImmersion: new GetDemandeImmersion({
      demandeImmersionRepository: repositories.demandeImmersion,
      featureFlags,
    }),
    listDemandeImmersion: new ListDemandeImmersion({
      demandeImmersionRepository: repositories.demandeImmersion,
      featureFlags,
    }),
    updateDemandeImmersion: new UpdateDemandeImmersion({
      demandeImmersionRepository: repositories.demandeImmersion,
      featureFlags,
    }),
    validateDemandeImmersion: new ValidateDemandeImmersion({
      demandeImmersionRepository: repositories.demandeImmersion,
    }),

    // siret
    getSiret: new GetSiret({
      sireneRepository: repositories.sirene,
    }),
  };
};

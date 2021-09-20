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
  applicationSourceFromString,
} from "../../shared/DemandeImmersionDto";
import { FeatureFlags } from "../../shared/featureFlags";
import { logger } from "../../utils/logger";
import { AirtableDemandeImmersionRepository } from "../secondary/AirtableDemandeImmersionRepository";
import { AirtableOriginalBetaDemandeImmersionRepository } from "../secondary/AirtableOriginalBetaDemandeImmersionRepository";
import { HttpsSireneRepository } from "../secondary/HttpsSireneRepository";
import { InMemoryDemandeImmersionRepository } from "../secondary/InMemoryDemandeImmersionRepository";
import { InMemoryEmailGateway } from "../secondary/InMemoryEmailGateway";
import { InMemorySireneRepository } from "../secondary/InMemorySireneRepository";
import { SendinblueEmailGateway } from "../secondary/SendinblueEmailGateway";

export const getRepositories = () => {
  logger.info("Repositories : " + process.env.REPOSITORIES ?? "IN_MEMORY");
  logger.info(
    "SIRENE_REPOSITORY: " + process.env.SIRENE_REPOSITORY ?? "IN_MEMORY"
  );
  logger.info("EMAIL_GATEWAY: " + process.env.EMAIL_GATEWAY ?? "IN_MEMORY");

  return {
    demandeImmersionGeneric:
      process.env.REPOSITORIES === "AIRTABLE"
        ? AirtableDemandeImmersionRepository.create(
            getEnvVarOrDie("AIRTABLE_API_KEY"),
            getEnvVarOrDie("AIRTABLE_BASE_ID_GENERIC"),
            getEnvVarOrDie("AIRTABLE_TABLE_NAME_GENERIC")
          )
        : new InMemoryDemandeImmersionRepository(),
    demandeImmersionBoulogneSurMer:
      process.env.REPOSITORIES === "AIRTABLE"
        ? AirtableOriginalBetaDemandeImmersionRepository.create(
            getEnvVarOrDie("AIRTABLE_API_KEY"),
            getEnvVarOrDie("AIRTABLE_BASE_ID_BOULOGNE_SUR_MER"),
            getEnvVarOrDie("AIRTABLE_TABLE_NAME_BOULOGNE_SUR_MER")
          )
        : new InMemoryDemandeImmersionRepository(),
    demandeImmersionNarbonne:
      process.env.REPOSITORIES === "AIRTABLE"
        ? AirtableOriginalBetaDemandeImmersionRepository.create(
            getEnvVarOrDie("AIRTABLE_API_KEY"),
            getEnvVarOrDie("AIRTABLE_BASE_ID_NARBONNE"),
            getEnvVarOrDie("AIRTABLE_TABLE_NAME_NARBONNE")
          )
        : new InMemoryDemandeImmersionRepository(),

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
  const repositories = getRepositories();
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
      genericRepository: repositories.demandeImmersionGeneric,
      boulogneSurMerRepository: repositories.demandeImmersionBoulogneSurMer,
      narbonneRepository: repositories.demandeImmersionNarbonne,
      emailGateway: repositories.email,
      featureFlags,
      supervisorEmail: supervisorEmail,
      unrestrictedEmailSendingSources,
      emailAllowList,
    }),
    getDemandeImmersion: new GetDemandeImmersion({
      demandeImmersionRepository: repositories.demandeImmersionGeneric,
      featureFlags,
    }),
    listDemandeImmersion: new ListDemandeImmersion({
      demandeImmersionRepository: repositories.demandeImmersionGeneric,
      featureFlags,
    }),
    updateDemandeImmersion: new UpdateDemandeImmersion({
      demandeImmersionRepository: repositories.demandeImmersionGeneric,
      featureFlags,
    }),
    validateDemandeImmersion: new ValidateDemandeImmersion({
      demandeImmersionRepository: repositories.demandeImmersionGeneric,
    }),

    // siret
    getSiret: new GetSiret({
      sireneRepository: repositories.sirene,
    }),
  };
};

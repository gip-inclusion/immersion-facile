import { ALWAYS_REJECT } from "../../domain/auth/AuthChecker";
import { AddDemandeImmersion } from "../../domain/demandeImmersion/useCases/AddDemandeImmersion";
import { ListDemandeImmersion } from "../../domain/demandeImmersion/useCases/ListDemandeImmersion";
import { AirtableDemandeImmersionRepository } from "../secondary/AirtableDemandeImmersionRepository";
import { InMemoryDemandeImmersionRepository } from "../secondary/InMemoryDemandeImmersionRepository";
import { logger } from "../../utils/logger";
import { InMemoryAuthChecker } from "../../domain/auth/InMemoryAuthChecker";
import { GetDemandeImmersion } from "../../domain/demandeImmersion/useCases/GetDemandeImmersion";
import { UpdateDemandeImmersion } from "../../domain/demandeImmersion/useCases/UpdateDemandeImmersion";
import { HttpsSireneRepository } from "../secondary/HttpsSireneRepository";
import { InMemoryEmailGateway } from "../secondary/InMemoryEmailGateway";
import { InMemorySireneRepository } from "../secondary/InMemorySireneRepository";
import { SendinblueEmailGateway } from "../secondary/SendinblueEmailGateway";
import { GetSiret } from "../../domain/sirene/useCases/GetSiret";

export const getRepositories = () => {
  logger.info("Repositories : " + process.env.REPOSITORIES ?? "IN_MEMORY");
  logger.info(
    "SIRENE_REPOSITORY: " + process.env.SIRENE_REPOSITORY ?? "IN_MEMORY"
  );
  logger.info("EMAIL_GATEWAY: " + process.env.EMAIL_GATEWAY ?? "IN_MEMORY");

  return {
    demandeImmersion:
      process.env.REPOSITORIES === "AIRTABLE"
        ? AirtableDemandeImmersionRepository.create(
            getEnvVarOrDie("AIRTABLE_API_KEY"),
            getEnvVarOrDie("AIRTABLE_BASE_ID"),
            getEnvVarOrDie("AIRTABLE_TABLE_NAME")
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

export const getUsecases = () => {
  const repositories = getRepositories();
  const supervisorEmail = process.env.SUPERVISOR_EMAIL;
  if (!supervisorEmail) {
    logger.warn(
      "No SUPERVISOR_EMAIL specified. Disabling the sending of supervisor emails."
    );
  }

  const emailAllowlist = (process.env.EMAIL_ALLOWLIST || "")
    .split(",")
    .filter((el) => !!el);
  if (!emailAllowlist) {
    logger.warn(
      "Empty EMAIL_ALLOWLIST. Disabling the sending of non-supervisor emails."
    );
  }

  return {
    // formulaire
    addDemandeImmersion: new AddDemandeImmersion({
      demandeImmersionRepository: repositories.demandeImmersion,
      emailGateway: repositories.email,
      supervisorEmail: supervisorEmail,
      emailAllowlist: emailAllowlist,
    }),
    getDemandeImmersion: new GetDemandeImmersion({
      demandeImmersionRepository: repositories.demandeImmersion,
    }),
    listDemandeImmersion: new ListDemandeImmersion({
      demandeImmersionRepository: repositories.demandeImmersion,
    }),
    updateDemandeImmersion: new UpdateDemandeImmersion({
      demandeImmersionRepository: repositories.demandeImmersion,
    }),

    // siret
    getSiret: new GetSiret({
      sireneRepository: repositories.sirene,
    }),
  };
};

import { AirtableDemandeImmersionRepository } from "src/adapters/secondary/AirtableDemandeImmersionRepository";
import { HttpsSireneRepository } from "src/adapters/secondary/HttpsSireneRepository";
import { InMemoryDemandeImmersionRepository } from "src/adapters/secondary/InMemoryDemandeImmersionRepository";
import { InMemoryEmailGateway } from "src/adapters/secondary/InMemoryEmailGateway";
import { InMemorySireneRepository } from "src/adapters/secondary/InMemorySireneRepository";
import { InMemoryTodoRepository } from "src/adapters/secondary/InMemoryTodoRepository";
import { JsonTodoRepository } from "src/adapters/secondary/JsonTodoRepository";
import { SendinblueEmailGateway } from "src/adapters/secondary/SendinblueEmailGateway";
import { ALWAYS_REJECT } from "src/domain/auth/AuthChecker";
import { InMemoryAuthChecker } from "src/domain/auth/InMemoryAuthChecker";
import { AddDemandeImmersion } from "src/domain/demandeImmersion/useCases/AddDemandeImmersion";
import { GetDemandeImmersion } from "src/domain/demandeImmersion/useCases/GetDemandeImmersion";
import { ListDemandeImmersion } from "src/domain/demandeImmersion/useCases/ListDemandeImmersion";
import { UpdateDemandeImmersion } from "src/domain/demandeImmersion/useCases/UpdateDemandeImmersion";
import { GetSiret } from "src/domain/sirene/useCases/GetSiret";
import { Clock, CustomClock, RealClock } from "src/domain/todos/ports/Clock";
import { AddTodo } from "src/domain/todos/useCases/AddTodo";
import { ListTodos } from "src/domain/todos/useCases/ListTodos";
import { logger } from "src/utils/logger";

export const getRepositories = () => {
  logger.info("Repositories : " + process.env.REPOSITORIES ?? "IN_MEMORY");
  logger.info(
    "SIRENE_REPOSITORY: " + process.env.SIRENE_REPOSITORY ?? "IN_MEMORY"
  );
  logger.info("EMAIL_GATEWAY: " + process.env.EMAIL_GATEWAY ?? "IN_MEMORY");

  return {
    todo:
      process.env.REPOSITORIES === "JSON"
        ? new JsonTodoRepository(`${__dirname}/../secondary/app-data.json`)
        : new InMemoryTodoRepository(),

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

const getClock = (): Clock => {
  logger.info(`NODE_ENV : ${process.env.NODE_ENV}`);

  if (process.env.NODE_ENV === "test") {
    const clock = new CustomClock();
    clock.setNextDate(new Date("2020-11-02T10:00"));
    return clock;
  }
  return new RealClock();
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
    // todo
    addTodo: new AddTodo({
      todoRepository: repositories.todo,
      clock: getClock(),
    }),
    listTodos: new ListTodos(repositories.todo),

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

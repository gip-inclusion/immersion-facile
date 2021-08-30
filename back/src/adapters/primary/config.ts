import { ALWAYS_REJECT } from "./../../domain/auth/AuthChecker";
import { Clock, CustomClock, RealClock } from "../../domain/todos/ports/Clock";
import { AddFormulaire } from "../../domain/formulaires/useCases/AddFormulaire";
import { ListFormulaires } from "../../domain/formulaires/useCases/ListFormulaires";
import { AddTodo } from "../../domain/todos/useCases/AddTodo";
import { ListTodos } from "../../domain/todos/useCases/ListTodos";
import { AirtableFormulaireRepository } from "../secondary/AirtableFormulaireRepository";
import { InMemoryFormulaireRepository } from "../secondary/InMemoryFormulaireRepository";
import { InMemoryTodoRepository } from "../secondary/InMemoryTodoRepository";
import { JsonTodoRepository } from "../secondary/JsonTodoRepository";
import { logger } from "../../utils/logger";
import { InMemoryAuthChecker } from "../../domain/auth/InMemoryAuthChecker";
import { GetFormulaire } from "../../domain/formulaires/useCases/GetFormulaire";
import { UpdateFormulaire } from "../../domain/formulaires/useCases/UpdateFormulaire";
import { HttpsSireneRepository } from "../secondary/HttpsSireneRepository";
import { InMemorySireneRepository } from "../secondary/InMemorySireneRepository";
import { GetSiret } from "../../domain/sirene/useCases/GetSiret";

export const getRepositories = () => {
  logger.info("Repositories : " + process.env.REPOSITORIES ?? "IN_MEMORY");
  logger.info(
    "SIRENE_REPOSITORY: " + process.env.SIRENE_REPOSITORY ?? "IN_MEMORY"
  );

  return {
    todo:
      process.env.REPOSITORIES === "JSON"
        ? new JsonTodoRepository(`${__dirname}/../secondary/app-data.json`)
        : new InMemoryTodoRepository(),

    formulaires:
      process.env.REPOSITORIES === "AIRTABLE"
        ? AirtableFormulaireRepository.create(
            process.env.AIRTABLE_API_KEY ||
              fail("Missing environment variable: AIRTABLE_API_KEY"),
            process.env.AIRTABLE_BASE_ID ||
              fail("Missing environment variable: AIRTABLE_BASE_ID"),
            process.env.AIRTABLE_TABLE_NAME ||
              fail("Missing environment variable: AIRTABLE_TABLE_NAME")
          )
        : new InMemoryFormulaireRepository(),

    sirene:
      process.env.SIRENE_REPOSITORY === "HTTPS"
        ? HttpsSireneRepository.create(
            process.env.SIRENE_ENDPOINT ||
              fail("Missing environment variable: SIRENE_ENDPOINT"),
            process.env.SIRENE_BEARER_TOKEN ||
              fail("Missing environment variable: SIRENE_BEARER_TOKEN")
          )
        : new InMemorySireneRepository(),
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
    username =
      process.env.BACKOFFICE_USERNAME ||
      fail("Missing environment variable: BACKOFFICE_USERNAME");
    password =
      process.env.BACKOFFICE_PASSWORD ||
      fail("Missing environment variable: BACKOFFICE_PASSWORD");
  }

  return InMemoryAuthChecker.create(username, password);
};

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

  return {
    // todo
    addTodo: new AddTodo({
      todoRepository: repositories.todo,
      clock: getClock(),
    }),
    listTodos: new ListTodos(repositories.todo),

    // formulaire
    addFormulaire: new AddFormulaire({
      formulaireRepository: repositories.formulaires,
    }),
    getFormulaire: new GetFormulaire({
      formulaireRepository: repositories.formulaires,
    }),
    listFormulaires: new ListFormulaires({
      formulaireRepository: repositories.formulaires,
    }),
    updateFormulaire: new UpdateFormulaire({
      formulaireRepository: repositories.formulaires,
    }),

    // siret
    getSiret: new GetSiret({
      sireneRepository: repositories.sirene,
    }),
  };
};

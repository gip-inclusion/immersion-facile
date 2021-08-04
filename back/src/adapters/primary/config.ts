import { Clock, CustomClock, RealClock } from "../../domain/todos/ports/Clock";
import { AddFormulaire } from "../../domain/formulaires/useCases/AddFormulaire";
import { ListFormulaires } from "../../domain/formulaires/useCases/ListFormulaires";
import { AddTodo } from "../../domain/todos/useCases/AddTodo";
import { ListTodos } from "../../domain/todos/useCases/ListTodos";
import { AirtableFormulaireRepository } from "../secondary/AirtableFormulaireRepository";
import { InMemoryFormulaireRepository } from "../secondary/InMemoryFormulaireRepository";
import { InMemoryTodoRepository } from "../secondary/InMemoryTodoRepository";
import { JsonTodoRepository } from "../secondary/JsonTodoRepository";

export const getRepositories = () => {
  console.log("Repositories : ", process.env.REPOSITORIES ?? "IN_MEMORY");

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
  };
};

 const fail = (message: string) => {
   throw new Error(message);
 };

const getClock = (): Clock => {
  console.log("NODE_ENV : ", process.env.NODE_ENV);

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
    addTodo: new AddTodo({
      todoRepository: repositories.todo,
      clock: getClock(),
    }),
    listTodos: new ListTodos(repositories.todo),
    addFormulaire: new AddFormulaire({
      formulaireRepository: repositories.formulaires,
    }),
    listFormulaires: new ListFormulaires({
      formulaireRepository: repositories.formulaires,
    }),
  };
};

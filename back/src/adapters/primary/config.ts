import { Clock, CustomClock, RealClock } from "../../domain/todos/ports/Clock";
import { AddTodo } from "../../domain/todos/useCases/AddTodo";
import { ListTodos } from "../../domain/todos/useCases/ListTodos";
import { InMemoryTodoRepository } from "../secondary/InMemoryTodoRepository";
import { JsonTodoRepository } from "../secondary/JsonTodoRepository";

export const getRepositories = () => {
  console.log("Repositories : ", process.env.REPOSITORIES ?? "IN_MEMORY");

  return {
    todo:
      process.env.REPOSITORIES === "JSON"
        ? new JsonTodoRepository(`${__dirname}/../secondary/app-data.json`)
        : new InMemoryTodoRepository(),
  };
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
  };
};

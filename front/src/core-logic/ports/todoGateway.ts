import type { TodoDto } from "src/core-logic/useCases/todoSlice";

export interface TodoGateway {
  retrieveAll: () => Promise<TodoDto[]>;
  add: (todo: TodoDto) => Promise<void>;
}

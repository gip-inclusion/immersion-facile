import { TodoDto } from "src/shared/TodoDto";

export interface TodoGateway {
  retrieveAll: () => Promise<TodoDto[]>;
  add: (todo: TodoDto) => Promise<void>;
}

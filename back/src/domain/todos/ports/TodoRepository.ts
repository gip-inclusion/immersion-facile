import { TodoEntity } from "../entities/TodoEntity";

export interface TodoRepository {
  save: (todoEntity: TodoEntity) => Promise<void>;
  getAllTodos: () => Promise<TodoEntity[]>;
}

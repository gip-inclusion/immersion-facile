import { TodoRepository } from "../../domain/todos/ports/TodoRepository";
import { TodoEntity } from "../../domain/todos/entities/TodoEntity";

export class InMemoryTodoRepository implements TodoRepository {
  private _todos: TodoEntity[] = [];

  public async save(todoEntity: TodoEntity) {
    const todoAlreadyExists = this._todos.some(
      ({ uuid }) => uuid === todoEntity.uuid
    );
    if (todoAlreadyExists) {
      throw new Error("A Todo with the same uuid already exists");
    }
    this._todos.push(todoEntity);
  }

  public async getAllTodos() {
    return this._todos;
  }

  get todos() {
    return this._todos;
  }

  setTodos(todoEntites: TodoEntity[]) {
    this._todos = todoEntites;
  }
}

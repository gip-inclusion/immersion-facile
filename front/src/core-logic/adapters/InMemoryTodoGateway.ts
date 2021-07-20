import { TodoGateway } from "src/core-logic/ports/todoGateway";
import type { TodoDto } from "src/shared/TodoDto";

export class InMemoryTodoGateway implements TodoGateway {
  constructor(private _todos: TodoDto[] = []) {}

  public async add(todo: TodoDto): Promise<void> {
    this._todos.push(todo);
  }

  public async retrieveAll(): Promise<TodoDto[]> {
    return this._todos;
  }

  // for test purpose:
  public setTodos(todos: TodoDto[]) {
    this._todos = todos;
  }

  public getTodos() {
    return this._todos;
  }
}

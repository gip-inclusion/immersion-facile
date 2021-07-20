import { TodoEntity } from "../../domain/todos/entities/TodoEntity";
import { TodoRepository } from "../../domain/todos/ports/TodoRepository";
import * as fs from "fs";
import * as util from "util";

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

export class JsonTodoRepository implements TodoRepository {
  constructor(private path: string) {}

  public async save(todoEntity: TodoEntity) {
    const todos = await this._readData();
    const todoWithSameUuidExists = todos.some(
      ({ uuid }) => uuid === todoEntity.uuid
    );
    if (todoWithSameUuidExists)
      throw new Error("A Todo with the same uuid already exists");
    todos.push(todoEntity);
    writeFile(this.path, JSON.stringify(todos));
  }

  public async getAllTodos() {
    return this._readData();
  }

  private async _readData(): Promise<TodoEntity[]> {
    const data = await readFile(this.path);
    const todos = JSON.parse(data.toString());
    return todos;
  }
}

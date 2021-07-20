import { TodoDto } from "../../../shared/TodoDto";
import { UseCase } from "../../core/UseCase";
import { todoEntityToDto } from "../entities/TodoEntity";
import { TodoRepository } from "../ports/TodoRepository";

export class ListTodos implements UseCase<void, TodoDto[]> {
  constructor(private todoRepository: TodoRepository) {}

  public async execute() {
    const entities = await this.todoRepository.getAllTodos();
    return entities.map(todoEntityToDto);
  }
}

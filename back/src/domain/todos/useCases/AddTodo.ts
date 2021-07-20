import { UseCase } from "../../core/UseCase";
import { TodoEntity } from "../entities/TodoEntity";
import { TodoRepository } from "../ports/TodoRepository";
import { Clock } from "../ports/Clock";
import { TodoDto } from "../../../shared/TodoDto";

type AddTodoDependencies = { todoRepository: TodoRepository; clock: Clock };

export class AddTodo implements UseCase<TodoDto> {
  private readonly todoRepository: TodoRepository;
  private readonly clock: Clock;

  constructor({ todoRepository, clock }: AddTodoDependencies) {
    this.todoRepository = todoRepository;
    this.clock = clock;
  }

  public async execute(params: TodoDto) {
    const todo = TodoEntity.create(params, this.clock);
    await this.todoRepository.save(todo);
  }
}

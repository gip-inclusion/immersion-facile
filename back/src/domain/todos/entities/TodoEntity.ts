import { TodoDto } from "../../../shared/TodoDto";
import { Clock } from "../ports/Clock";

type TodoProps = {
  uuid: string;
  description: string;
};

export class TodoEntity {
  public readonly uuid: string;
  public readonly description: string;

  private constructor({ uuid, description }: TodoProps) {
    this.uuid = uuid;
    this.description = description;
  }

  public static create(todoDto: TodoDto, clock: Clock) {
    const hour = clock.getNow().getHours();
    if (hour < 8 || hour >= 12)
      throw new Error(`You can only add todos between 08h00 and 12h00. Was: ${hour}`);

    const trimmedDescription = todoDto.description.trim();

    if (trimmedDescription.length <= 3) {
      throw new Error("Todo description should be at least 4 characters long");
    }

    const capitalizedDescription =
      trimmedDescription[0].toUpperCase() + trimmedDescription.slice(1);

    return new TodoEntity({
      uuid: todoDto.uuid,
      description: capitalizedDescription,
    });
  }
}

export const todoEntityToDto = (entity: TodoEntity): TodoDto => ({
  uuid: entity.uuid,
  description: entity.description,
});

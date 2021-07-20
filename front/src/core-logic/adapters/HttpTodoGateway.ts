import axios from "axios";
import { TodoGateway } from "src/core-logic/ports/todoGateway";
import { todosRoute } from "src/shared/routes";
import type { TodoDto } from "src/shared/TodoDto";

const prefix = "api";

export class HttpTodoGateway implements TodoGateway {
  public async add(todo: TodoDto): Promise<void> {
    await axios.post(`/${prefix}/${todosRoute}`, todo);
  }

  public async retrieveAll(): Promise<TodoDto[]> {
    const response = await axios.get(`/${prefix}/${todosRoute}`);
    return response.data;
  }
}

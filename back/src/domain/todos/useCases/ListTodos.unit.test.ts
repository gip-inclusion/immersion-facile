import { InMemoryTodoRepository } from "../../../adapters/secondary/InMemoryTodoRepository";
import { ListTodos } from "./ListTodos";

describe("List Todos", () => {
  it("sends empty list when no todos are stored", async () => {
    const todoRepository = new InMemoryTodoRepository();
    const listTodos = new ListTodos(todoRepository);

    const todos = await listTodos.execute();

    expect(todos).toEqual([]);
  });

  describe("When a todo is already stored", () => {
    it("sends the todo", async () => {
      const todoRepository = new InMemoryTodoRepository();
      const todoStored = { uuid: "someUuid", description: "My description" };
      todoRepository.setTodos([todoStored]);
      const listTodos = new ListTodos(todoRepository);

      const todos = await listTodos.execute();

      expect(todos).toEqual([
        { uuid: "someUuid", description: "My description" },
      ]);
    });
  });
});

import { AddTodo } from "./AddTodo";
import { v4 as generateUuid } from "uuid";
import { InMemoryTodoRepository } from "../../../adapters/secondary/InMemoryTodoRepository";
import { expectPromiseToFailWith } from "../../../utils/test.helpers";
import { CustomClock } from "../ports/Clock";

describe("Add Todo", () => {
  let addTodo: AddTodo;
  let todoRepository: InMemoryTodoRepository;
  let clock: CustomClock;

  beforeEach(() => {
    todoRepository = new InMemoryTodoRepository();
    clock = new CustomClock();
    addTodo = new AddTodo({ todoRepository, clock });
    clock.setNextDate(new Date("2020-11-02T10:00"));
  });

  describe("Description has less than 3 charaters", () => {
    it("refuses to add the Todo with an explicit warning", async () => {
      await expectPromiseToFailWith(
        addTodo.execute({ uuid: "someUuid", description: "123" }),
        "Todo description should be at least 4 characters long"
      );
    });
  });

  describe("Todo with same uuid already exists", () => {
    it("refuses to add the Todo with an explicit warning", async () => {
      todoRepository.setTodos([
        { uuid: "alreadyExistingUuid", description: "Some description" },
      ]);
      await expectPromiseToFailWith(
        addTodo.execute({
          uuid: "alreadyExistingUuid",
          description: "My description",
        }),
        "A Todo with the same uuid already exists"
      );
    });
  });

  describe("Description is fine", () => {
    it("saves the Todo", async () => {
      const uuid = generateUuid();
      const description = "My description";
      await addTodo.execute({ uuid, description });
      expect(todoRepository.todos).toEqual([{ uuid, description }]);
    });
  });

  describe("Description has trailing white space", () => {
    it("removes the white spaces and capitalize before saving the Todo", async () => {
      const uuid = "myUuid";
      const description = "   should Be trimed  ";
      await addTodo.execute({ uuid, description });
      expect(todoRepository.todos).toEqual([
        { uuid, description: "Should Be trimed" },
      ]);
    });
  });

  describe("Depending on time", () => {
    it("refuses to add Todo before 08h00", async () => {
      clock.setNextDate(new Date("2020-11-02T07:59"));
      const useCasePromise = addTodo.execute({
        uuid: "someUuid",
        description: "a description",
      });
      await expectPromiseToFailWith(
        useCasePromise,
        "You can only add todos between 08h00 and 12h00"
      );
    });

    it("refuses to add Todo after 12h00", async () => {
      clock.setNextDate(new Date("2020-11-02T12:00"));
      const useCasePromise = addTodo.execute({
        uuid: "someUuid",
        description: "a description",
      });
      await expectPromiseToFailWith(
        useCasePromise,
        "You can only add todos between 08h00 and 12h00"
      );
    });
  });
});

import {
  configureReduxStore,
  ReduxStore,
} from "src/core-logic/store/initilizeStore";
import { InMemoryTodoGateway } from "src/core-logic/adapters/InMemoryTodoGateway";
import { actions } from "src/core-logic/store/rootActions";
import type { RootState } from "src/core-logic/store/rootReducer";
import { todoSlice, TodoDto } from "src/core-logic/useCases/todoSlice";

const makeExpectStateToEqual =
  (store: ReduxStore) => (expectedState: RootState) =>
    expect(store.getState()).toEqual(expectedState);

describe("todoSlice", () => {
  let todoGateway: InMemoryTodoGateway;
  let store: ReduxStore;
  let expectStateToEqual: (expectedState: RootState) => void;

  beforeEach(() => {
    todoGateway = new InMemoryTodoGateway();
    store = configureReduxStore({ todoGateway });
    expectStateToEqual = makeExpectStateToEqual(store);
  });

  describe("add Todo", () => {
    it("shows that Todos are being fetched, and already take Todo beeing added", () => {
      const todo: TodoDto = { uuid: "someId", description: "my description" };
      store.dispatch(todoSlice.actions.startedToAddTodo(todo));
      expectStateToEqual({
        todo: {
          items: [todo],
          isFetching: false,
          isAdding: true,
        },
      });
    });

    it("adds a Todo", async () => {
      const todo: TodoDto = { uuid: "someUuid", description: "my todo" };

      await store.dispatch(actions.addTodoThunk(todo));

      expectStateToEqual({
        todo: {
          items: [todo],
          isFetching: false,
          isAdding: false,
        },
      });
      expect(todoGateway.getTodos()).toEqual([todo]);
    });
  });

  describe("add Todo", () => {
    it("shows that Todos are being fetched", () => {
      store.dispatch(todoSlice.actions.startedToFetchTodos());
      expectStateToEqual({
        todo: {
          items: [],
          isFetching: true,
          isAdding: false,
        },
      });
    });

    describe("when no Todos are saved yet", () => {
      it("gets no todos", async () => {
        await store.dispatch(actions.fetchTodosThunk());
        expectStateToEqual({
          todo: {
            items: [],
            isFetching: false,
            isAdding: false,
          },
        });
      });
    });

    describe("when there are Todos to get", () => {
      it("gets no todos", async () => {
        const todos: TodoDto[] = [
          { uuid: "uuid1", description: "my description" },
          { uuid: "uuid2", description: "something else to do" },
        ];
        todoGateway.setTodos(todos);
        await store.dispatch(actions.fetchTodosThunk());
        expectStateToEqual({
          todo: {
            items: todos,
            isFetching: false,
            isAdding: false,
          },
        });
      });
    });
  });
});

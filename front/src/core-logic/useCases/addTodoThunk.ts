import { AppThunk } from "src/core-logic/store/initilizeStore";
import { todoSlice } from "src/core-logic/useCases/todoSlice";
import type { TodoDto } from "src/shared/TodoDto";

export const addTodoThunk =
  (todo: TodoDto): AppThunk =>
  async (dispatch, _, { todoGateway }) => {
    dispatch(todoSlice.actions.startedToAddTodo(todo));
    await todoGateway.add(todo);
    dispatch(todoSlice.actions.successfullyAddedTodo());
  };

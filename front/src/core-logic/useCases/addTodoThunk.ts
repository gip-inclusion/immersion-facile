import { AppThunk } from "src/core-logic/store/initilizeStore";
import { todoSlice, TodoDto } from "src/core-logic/useCases/todoSlice";

export const addTodoThunk =
  (todo: TodoDto): AppThunk =>
  async (dispatch, _, { todoGateway }) => {
    dispatch(todoSlice.actions.startedToAddTodo(todo));
    await todoGateway.add(todo);
    dispatch(todoSlice.actions.successfullyAddedTodo());
  };

import { AppThunk } from "src/core-logic/store/initilizeStore";
import { todoSlice } from "src/core-logic/useCases/todoSlice";

export const fetchTodosThunk: () => AppThunk =
  () =>
  async (dispatch, _, { todoGateway }) => {
    dispatch(todoSlice.actions.startedToFetchTodos());
    return todoGateway.retrieveAll().then((todos) => {
      dispatch(todoSlice.actions.successfullyFetchedTodos(todos));
    });
  };

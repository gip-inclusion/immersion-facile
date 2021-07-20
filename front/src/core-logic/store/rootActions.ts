import { addTodoThunk } from "src/core-logic/useCases/addTodoThunk";
import { fetchTodosThunk } from "src/core-logic/useCases/fetchTodosThunk";
import { todoSlice } from "src/core-logic/useCases/todoSlice";

export const actions = {
  addTodoThunk,
  fetchTodosThunk,
};

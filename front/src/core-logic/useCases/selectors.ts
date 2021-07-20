import type { RootState } from "src/core-logic/store/rootReducer";

export const todosSelector = (state: RootState) => state.todo.items;

export const isFetchingTodosSelector = (state: RootState) =>
  state.todo.isFetching;

export const isAddingTodoSelector = (state: RootState) => state.todo.isAdding;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { TodoDto } from "src/shared/TodoDto";

interface TodoState {
  items: TodoDto[];
  isFetching: boolean;
  isAdding: boolean;
}

const initialState: TodoState = {
  items: [],
  isFetching: false,
  isAdding: false,
};

export const todoSlice = createSlice({
  name: "todo",
  initialState,
  reducers: {
    startedToAddTodo: (state, action: PayloadAction<TodoDto>) => ({
      ...state,
      isAdding: true,
      items: [...state.items, action.payload],
    }),
    successfullyAddedTodo: (state) => ({ ...state, isAdding: false }),
    startedToFetchTodos: (state) => ({ ...state, isFetching: true }),
    successfullyFetchedTodos: (state, action: PayloadAction<TodoDto[]>) => ({
      ...state,
      isFetching: false,
      items: action.payload,
    }),
  },
});

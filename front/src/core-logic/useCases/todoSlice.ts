import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";

export const todoDtoSchema = z.object({
  uuid: z.string(),
  description: z.string(),
});

export type TodoDto = z.infer<typeof todoDtoSchema>;

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

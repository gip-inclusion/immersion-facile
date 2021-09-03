import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { TodoGateway } from "src/core-logic/ports/todoGateway";
import { rootReducer } from "src/core-logic/store/rootReducer";
import type { RootState } from "src/core-logic/store/rootReducer";

export type Dependencies = {
  todoGateway: TodoGateway;
};

export const configureReduxStore = (dependencies: Dependencies) =>
  configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware({
      thunk: {
        extraArgument: dependencies,
      },
    }),
  });

export type ReduxStore = ReturnType<typeof configureReduxStore>;

export type AppThunk = ThunkAction<
  Promise<void>,
  RootState,
  Dependencies,
  Action<string>
>;

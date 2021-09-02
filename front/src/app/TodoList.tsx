import React from "react";
import { useAppSelector } from "src/app/reduxHooks";
import {
  isFetchingTodosSelector,
  todosSelector,
} from "src/core-logic/useCases/selectors";

export const TodoList = () => {
  const isFetchingTodos = useAppSelector(isFetchingTodosSelector);
  const todos = useAppSelector(todosSelector);

  return (
    <ul>
      {isFetchingTodos
        ? "Loading..."
        : todos.map((todo) => <li key={todo.uuid}>{todo.description}</li>)}
    </ul>
  );
};

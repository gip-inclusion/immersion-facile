import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "src/app/reduxHooks";
import { TodoList } from "src/app/TodoList";
import { actions } from "src/core-logic/store/rootActions";
import { isAddingTodoSelector } from "src/core-logic/useCases/selectors";
import { v4 as uuidV4 } from "uuid";
import "./App.css";
import logo from "./logo.svg";

const useFetchInitialTodos = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(actions.fetchTodosThunk());
  }, [dispatch]);
};

export const App = () => {
  useFetchInitialTodos();
  const dispatch = useDispatch();
  const isAddingTodo = useAppSelector(isAddingTodoSelector);
  const [description, setDescription] = useState("");

  const addTodo = () => {
    dispatch(actions.addTodoThunk({ uuid: uuidV4(), description }));
    setDescription("");
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>My todos</p>
        <TodoList />
        <input
          type="text"
          value={description}
          onChange={(evt) => {
            if (!isAddingTodo) setDescription(evt.target.value);
          }}
          onKeyDown={(evt) => evt.key === "Enter" && addTodo()}
        />
        <button disabled={isAddingTodo} onClick={addTodo}>
          Add Todo
        </button>
      </header>
    </div>
  );
};

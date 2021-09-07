import React from "react";
import { Admin } from "src/app/admin";
import { DemandeImmersionForm } from "src/app/DemandeImmersionForm";
import { Home } from "src/app/Home";
import { useRoute } from "src/app/routes";
import { TodoApp } from "src/app/TodoApp";

export const Router = () => {
  const route = useRoute();

  return (
    <>
      {route.name === "home" && <Home />}
      {route.name === "todos" && <TodoApp route={route} />}
      {route.name === "demandeImmersion" && (
        <DemandeImmersionForm route={route} />
      )}
      {route.name === "admin" && <Admin route={route} />}
      {route.name === false && "Not Found"}
    </>
  );
};

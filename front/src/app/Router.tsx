import React, { useState, useEffect } from "react";
import { Admin } from "src/app/admin";
import { DemandeImmersionForm } from "src/app/DemandeImmersionForm";
import { TodoApp } from "src/app/TodoApp";
import { useRoute } from "src/app/routes";

const Home = () => <div>Welcome to the app !</div>;

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

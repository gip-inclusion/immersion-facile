import React, { useState, useEffect } from "react";
import { Admin } from "src/app/admin";
import { Formulaire } from "src/app/formulaire";
import { TodoApp } from "src/app/TodoApp";
import { useRoute } from "src/app/routes";

const Home = () => <div>Welcome to the app !</div>;

export const Router = () => {
  const route = useRoute();

  return (
    <>
      {route.name === "home" && <Home />}
      {route.name === "todos" && <TodoApp route={route} />}
      {route.name === "demandeImmersion" && <Formulaire route={route} />}
      {route.name === "admin" && <Admin route={route} />}
      {route.name === false && "Not Found"}
    </>
  );
};

import React from "react";
import { routes } from "src/app/routes";

export const Navigation = () => (
  <nav>
    <a {...routes.home().link}>Home</a>
    {" - "}
    <a {...routes.demandeImmersion().link}>Demande immersion</a>
    {" - "}
    <a {...routes.admin().link}>Backoffice</a>
    {" - "}
    <a {...routes.todos().link}>Todo list</a>
  </nav>
);

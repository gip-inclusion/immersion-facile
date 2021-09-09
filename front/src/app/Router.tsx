import React from "react";
import { Admin } from "src/app/admin";
import { ApplicationForm } from "src/app/DemandeImmersionForm";
import { Home } from "src/app/Home";
import { useRoute } from "src/app/routes";
import { TodoApp } from "src/app/TodoApp";
import { ENV } from "src/environmentVariables";

const { featureFlags } = ENV;

const NotAvailable = () => <div>Cette page n'est pas disponible.</div>;

export const Router = () => {
  const route = useRoute();

  return (
    <>
      {route.name === "home" && <Home />}
      {route.name === "todos" && <TodoApp route={route} />}
      {route.name === "demandeImmersion" &&
        (featureFlags.enableGenericApplicationForm ? (
          <ApplicationForm route={route} />
        ) : (
          <NotAvailable />
        ))}
      {route.name === "boulogneSurMer" &&
        (featureFlags.enableBoulogneSurMerApplicationForm ? (
          <ApplicationForm route={route} />
        ) : (
          <NotAvailable />
        ))}
      {route.name === "narbonne" &&
        (featureFlags.enableNarbonneApplicationForm ? (
          <ApplicationForm route={route} />
        ) : (
          <NotAvailable />
        ))}
      {route.name === "admin" && <Admin route={route} />}
      {route.name === false && "Not Found"}
    </>
  );
};

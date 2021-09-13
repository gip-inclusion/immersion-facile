import React from "react";
import { Admin } from "src/app/admin";
import { ApplicationForm } from "src/app/DemandeImmersionForm";
import { Home } from "src/app/Home";
import { useRoute } from "src/app/routes";
import { TodoApp } from "src/app/TodoApp";
import { ENV } from "src/environmentVariables";

const { dev, featureFlags } = ENV;

const NotAvailable = () => <div>Cette page n'est pas disponible.</div>;

export const Router = () => {
  const route = useRoute();

  return (
    <>
      {route.name === "home" && <Home showDebugInfo={dev} />}
      {route.name === "todos" &&
        (dev ? <TodoApp route={route} /> : <NotAvailable />)}
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
      {route.name === "admin" &&
        (featureFlags.enableAdminUi ? (
          <Admin route={route} />
        ) : (
          <NotAvailable />
        ))}
      {route.name === false && <NotAvailable />}
    </>
  );
};

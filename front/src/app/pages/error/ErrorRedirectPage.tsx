import React from "react";
import { isManagedError } from "shared";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";
import { ErrorPage } from "./ErrorPage";

export type ErrorRedirectRoute = Route<typeof routes.errorRedirect>;

interface ErrorRedirectProps {
  route: ErrorRedirectRoute;
}

export const ErrorRedirectPage = ({
  route,
}: ErrorRedirectProps): JSX.Element => (
  <ErrorPage
    type={isManagedError(route.params.kind) ? route.params.kind : undefined}
    {...propertiesFromUrl(route)}
  />
);

type RedirectErrorProps = {
  message: string;
  title: string;
};

// const RedirectErrorFromUrl = ({
//   message,
//   title,
// }: RedirectErrorProps): JSX.Element => (
//   <div role="alert" className={`fr-alert fr-alert--error`}>
//     <p className="fr-alert__title">{title}</p>
//     {`${message}`}
//   </div>
// );

const propertiesFromUrl = (route: ErrorRedirectRoute): RedirectErrorProps => ({
  message: route.params.message ?? "Une erreur inattendue est survenue",
  title: route.params.title ?? "Une erreur est survenue",
});

import React, { ReactNode } from "react";

import {
  ManagedRedirectErrorKinds,
  managedRedirectErrorKinds,
} from "shared/src/errors/managedErrors";
import { ContainerLayout } from "src/app/layouts/ContainerLayout";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { routes } from "src/app/routing/routes";
import { Route } from "type-route";
import { PEConnectAdvisorForbiddenAccess } from "./PEConnectAdvisorForbiddenAccess";
import { PEConnectInvalidGrantError } from "./PEConnectInvalidGrantError";
import { PEConnectNoAuthorisation } from "./PEConnectNoAuthorisation";
import { PEConnectNoValidAdvisor } from "./PEConnectNoValidAdvisor";
import { PEConnectNoValidUser } from "./PEConnectNoValidUser";

export type ErrorRedirectRoute = Route<typeof routes.errorRedirect>;

interface ErrorRedirectProps {
  route: ErrorRedirectRoute;
}

const managedErrors: Record<ManagedRedirectErrorKinds, () => JSX.Element> = {
  peConnectNoAuthorisation: PEConnectNoAuthorisation,
  peConnectNoValidAdvisor: PEConnectNoValidAdvisor,
  peConnectNoValidUser: PEConnectNoValidUser,
  peConnectInvalidGrant: PEConnectInvalidGrantError,
  peConnectAdvisorForbiddenAccess: PEConnectAdvisorForbiddenAccess,
};

export const ErrorRedirectPage = ({ route }: ErrorRedirectProps) => (
  <HeaderFooterLayout>
    <ContainerLayout>{renderer({ route })}</ContainerLayout>
  </HeaderFooterLayout>
);

const renderer = ({ route }: ErrorRedirectProps): ReactNode => {
  const kind: string | undefined = route.params.kind;

  if (!isManagedError(kind)) {
    const properties = propertiesFromUrl(route);
    return <RedirectErrorFromUrl {...properties} />;
  }

  return managedErrors[kind]();
};

type RedirectErrorProps = {
  message: string;
  title: string;
};

const isManagedError = (
  kind: string | undefined,
): kind is ManagedRedirectErrorKinds => {
  if (!kind) return false;
  return managedRedirectErrorKinds.includes(kind as ManagedRedirectErrorKinds);
};

const RedirectErrorFromUrl = (error: RedirectErrorProps) => (
  <div role="alert" className={`fr-alert fr-alert--error`}>
    <p className="fr-alert__title">{error.title}</p>
    {`${error.message}`}
  </div>
);

const propertiesFromUrl = (route: ErrorRedirectRoute): RedirectErrorProps => ({
  message: route.params.message ?? "Une erreur inattendue est survenue",
  title: route.params.title ?? "Une erreur est survenue",
});

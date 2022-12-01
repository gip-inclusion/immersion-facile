import React, { ReactNode } from "react";
import { isManagedError } from "shared";
import { ContainerLayout } from "src/app/components/layout/ContainerLayout";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";
import { ManagedErrorSelector } from "./ManagedErrors";

export type ErrorRedirectRoute = Route<typeof routes.errorRedirect>;

interface ErrorRedirectProps {
  route: ErrorRedirectRoute;
}

export const ErrorRedirectPage = ({ route }: ErrorRedirectProps) => (
  <HeaderFooterLayout>
    <ContainerLayout>{renderer({ route })}</ContainerLayout>
  </HeaderFooterLayout>
);

const renderer = ({ route }: ErrorRedirectProps): ReactNode =>
  isManagedError(route.params.kind) ? (
    <ManagedErrorSelector kind={route.params.kind} />
  ) : (
    <RedirectErrorFromUrl {...propertiesFromUrl(route)} />
  );

type RedirectErrorProps = {
  message: string;
  title: string;
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

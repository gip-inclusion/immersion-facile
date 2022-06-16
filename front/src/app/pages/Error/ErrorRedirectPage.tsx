import React, { ReactNode } from "react";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { routes } from "src/app/routing/routes";
import { Route } from "type-route";

export type ErrorRedirectRoute = Route<typeof routes.errorRedirect>;

interface ErrorRedirectProps {
  route: ErrorRedirectRoute;
}

export const ErrorRedirectPage = ({ route }: ErrorRedirectProps) => (
  <HeaderFooterLayout>{renderer({ route })}</HeaderFooterLayout>
);

type RedirectErrorProps = {
  message: string;
  title: string;
  //params: { [key: string]: string | number };
};

const renderer = ({ route }: ErrorRedirectProps): ReactNode => {
  const kind = route.params.kind ?? "default";
  const properties = propertiesFromUrl(route);

  if (kind === 'peConnectInvalidGrant')
    return <InvalidPEConnectGrantError />

  return <NotificationError {...properties} />;
};

const NotificationError = (error: RedirectErrorProps) => (
  <div role="alert" className={`fr-alert fr-alert--error`}>
    <p className="fr-alert__title">{error.title}</p>
    {`${error.message}`}
  </div>
);

const InvalidPEConnectGrantError = () => (
  <div role="alert" className={`fr-alert fr-alert--error`}>
    <p className="fr-alert__title">
      Le code d'autorisation donnée par Pôle emploi ne permet pas de vous
      identifier.
    </p>
    Le code authorisation donnée par pole emploi ne permet pas d'avoir accès aux
    droit nécessaires pour lier votre compte. Vous pouvez quand même demander
    une immersion sans récupérer les informations de Pole emploi connect en
    indiquant l'agence qui vous accompagnes.
  </div>
);

const propertiesFromUrl = (route: ErrorRedirectRoute): RedirectErrorProps => ({
  message: route.params.message ?? "Si seulement on en savait plus",
  title: route.params.title ?? "Une erreur est survenue",
});

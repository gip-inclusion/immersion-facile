import React from "react";
import { ErrorNotification } from "./ErrorNotification";

type HttpUnknownClientErrorProperties = {
  children?: React.ReactNode;
};

export const HttpUnknownClientError = ({
  children,
}: HttpUnknownClientErrorProperties): JSX.Element => (
  <ErrorNotification title="Erreur client inconnue">
    {children}
  </ErrorNotification>
);

export const HttpClientNotFoundError = (): JSX.Element => (
  <ErrorNotification title="404 Page non trouvé." />
);

export const HttpClientInvalidToken = (): JSX.Element => (
  <ErrorNotification title="Votre token n'est pas valide." />
);

export const UnknownError = (): JSX.Element => (
  <ErrorNotification title="Erreur inconnue" />
);

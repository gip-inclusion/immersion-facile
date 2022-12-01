import React from "react";
import { ErrorNotification } from "./ErrorNotification";

export const UnknownError = (): JSX.Element => (
  <ErrorNotification title="Erreur inconnue" />
);

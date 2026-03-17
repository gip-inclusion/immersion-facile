import type { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import type { ReactElement, ReactNode } from "react";

export type FrontErrorProps = {
  buttons: ErrorButton[];
  subtitle?: string;
  title: string;
  description: ReactNode;
};

export type ErrorButton = ReactElement;

export type ContactErrorInformation = {
  errorMessage: string;
  priority?: ButtonProps["priority"];
};

import type { ReactElement } from "react";

export type FrontErrorProps = {
  buttons: ErrorButton[];
  subtitle?: string;
  title: string;
  description: string;
};

export type ErrorButton =
  | ReactElement
  | ((params: ContactErrorInformation) => ReactElement);

export type ContactErrorInformation = {
  currentUrl: string;
  currentDate: string;
  error: string;
};

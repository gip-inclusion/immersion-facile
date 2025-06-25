import type { ReactElement, ReactNode } from "react";

export type FrontErrorProps = {
  buttons: ErrorButton[];
  subtitle?: string;
  title: string;
  description: ReactNode;
};

export type ErrorButton =
  | ReactElement
  | ((params: ContactErrorInformation) => ReactElement);

export type ContactErrorInformation = {
  currentUrl: string;
  currentDate: string;
  error: ReactNode;
};

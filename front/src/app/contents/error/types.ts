export type FrontErrorProps = {
  buttons: ErrorButton[];
  subtitle?: string;
  title: string;
  description: string;
};

export type ErrorButton =
  | React.ReactElement
  | ((params: ContactErrorInformation) => React.ReactElement);

export type ContactErrorInformation = {
  currentUrl: string;
  currentDate: string;
  error: string;
};

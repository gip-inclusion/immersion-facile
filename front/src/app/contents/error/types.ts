export type HTTPFrontErrorContents = {
  overtitle: string;
  title: string;
  subtitle: string;
  description: string;
  buttons: ErrorButton[];
};

export type ErrorButton =
  | ErrorButtonProps
  | ((params: ContactErrorInformations) => ErrorButtonProps);

export type ContactErrorInformations = {
  currentUrl: string;
  currentDate: string;
  error: string;
};

export type ErrorButtonProps = {
  label: string;
  kind: "primary" | "secondary";
  href?: string;
  onClick?: () => void;
  target?: React.HTMLAttributeAnchorTarget;
};

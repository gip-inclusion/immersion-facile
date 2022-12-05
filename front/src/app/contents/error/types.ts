export type HTTPFrontErrorType = "404"; // "404" | "500" | "503"

export type HTTPFrontErrorContents = {
  overtitle: string;
  title: string;
  subtitle: string;
  description: string;
  buttons: ErrorButton[];
};

export type ErrorButton = {
  label: string;
  type: "primary" | "secondary";
  href?: string;
  onClick?: () => void;
};

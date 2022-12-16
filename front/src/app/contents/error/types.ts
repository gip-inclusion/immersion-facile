export type HTTPFrontErrorContents = {
  overtitle: string;
  title: string;
  subtitle: string;
  description: string;
  buttons: ErrorButton[];
};

export type ErrorButton = {
  label: string;
  kind: "primary" | "secondary";
  href?: string;
  onClick?: () => void;
  target?: React.HTMLAttributeAnchorTarget;
};

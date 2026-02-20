import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import Styles from "./SectionHighlight.styles";

export type SectionHighlightProps = {
  children: React.ReactNode;
  className?: string;
  priority?: "info" | "discrete";
};

export const SectionHighlight = ({
  children,
  className,
  priority = "info",
}: SectionHighlightProps) => {
  const { cx } = useStyles();
  const defaultClassName = fr.cx("fr-px-4w", "fr-py-3w");
  const classNameValue = cx(
    className ?? defaultClassName,
    Styles.root,
    Styles[priority],
  );

  return <div className={classNameValue}>{children}</div>;
};

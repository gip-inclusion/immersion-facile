import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import Styles from "./SectionHighlight.styles";

export const SectionHighlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { cx } = useStyles();
  const defaultClassName = fr.cx("fr-px-4w", "fr-py-3w");
  const classNameValue = cx(className ?? defaultClassName, Styles.root);

  return <div className={classNameValue}>{children}</div>;
};

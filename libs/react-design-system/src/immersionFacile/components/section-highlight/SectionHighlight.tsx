import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import Styles from "./SectionHighlight.styles";

export const SectionHighlight = ({
  children,
}: { children: React.ReactNode }) => {
  const { cx } = useStyles();
  return (
    <div className={cx(fr.cx("fr-px-4w", "fr-py-3w"), Styles.root)}>
      {children}
    </div>
  );
};

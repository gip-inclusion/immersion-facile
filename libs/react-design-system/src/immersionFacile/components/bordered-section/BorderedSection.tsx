import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import Styles from "./BorderedSection.styles";

export type BorderedSectionProps = {
  children: React.ReactNode;
  className?: string;
};

export const BorderedSection = ({
  children,
  className,
}: BorderedSectionProps) => {
  const { cx } = useStyles();

  return (
    <section className={cx(fr.cx("fr-p-2w"), Styles.root, className)}>
      {children}
    </section>
  );
};

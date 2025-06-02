import { fr } from "@codegouvfr/react-dsfr";
import type { ReactNode } from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./SeparatedSection.styles";

type SeparatedSectionProps = {
  firstSection: ReactNode;
  secondSection: ReactNode;
};

export const SeparatedSection = ({
  firstSection,
  secondSection,
}: SeparatedSectionProps) => {
  const { cx } = useStyles();

  return (
    <div className={cx(fr.cx("fr-grid-row"), Styles.root)}>
      <section className={fr.cx("fr-col-12", "fr-col-lg-5")}>
        {firstSection}
      </section>
      <div
        className={cx(
          fr.cx("fr-col-12", "fr-col-lg-2", "fr-my-2w"),
          Styles.separator,
        )}
      />
      <section className={fr.cx("fr-col-12", "fr-col-lg-5")}>
        {secondSection}
      </section>
    </div>
  );
};

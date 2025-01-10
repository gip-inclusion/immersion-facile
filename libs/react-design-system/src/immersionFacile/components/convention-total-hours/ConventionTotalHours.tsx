import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./ConventionTotalHours.styles";

export const ConventionTotalHours = ({
  totalHours,
  illustration,
}: {
  totalHours: string;
  illustration: React.ReactNode;
}) => {
  const { cx } = useStyles();
  return (
    <div className={cx(fr.cx("fr-mt-2w", "fr-p-2w"), Styles.root)}>
      <div className={cx(fr.cx("fr-mr-1w"), Styles.illustrationWrapper)}>
        {illustration}
      </div>
      <span>
        Le candidat a fait un total de <strong>{totalHours} d'immersion</strong>
        .
      </span>
    </div>
  );
};

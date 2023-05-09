import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import Styles from "./MaintenanceCallout.styles";

type MaintenanceCalloutProps = {
  message: string;
};

export const MaintenanceCallout = ({ message }: MaintenanceCalloutProps) => {
  const { cx } = useStyles();
  return (
    <div className={cx(Styles.root)} aria-live="polite">
      <p className={cx(fr.cx("fr-mb-0", "fr-p-2w"), Styles.message)}>
        {message}
      </p>
    </div>
  );
};

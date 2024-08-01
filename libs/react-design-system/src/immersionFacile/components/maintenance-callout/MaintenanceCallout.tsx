import { fr } from "@codegouvfr/react-dsfr";
import { AlertProps } from "@codegouvfr/react-dsfr/Alert";
import React from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./MaintenanceCallout.styles";

export type MaintenanceCalloutProps = {
  message: string;
  level: AlertProps.Severity;
};

export const MaintenanceCallout = ({
  message,
  level,
}: MaintenanceCalloutProps) => {
  const { cx } = useStyles();
  return (
    <div className={cx(Styles.root, Styles[level])} aria-live="polite">
      <p className={cx(fr.cx("fr-mb-0", "fr-p-2w"), Styles.message)}>
        {message}
      </p>
    </div>
  );
};
